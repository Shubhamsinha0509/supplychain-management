// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Pricing
 * @dev Contract for managing fair pricing and price discovery
 * @author Blockchain Supply Chain Team
 */
contract Pricing is AccessControl, ReentrancyGuard {
    
    // Role definitions
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    bytes32 public constant WHOLESALER_ROLE = keccak256("WHOLESALER_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant PRICING_ORACLE_ROLE = keccak256("PRICING_ORACLE_ROLE");

    // Price structure for different stages
    struct PriceInfo {
        uint256 farmGatePrice;      // Price paid to farmer
        uint256 wholesalePrice;     // Price at wholesaler
        uint256 retailPrice;        // Final retail price
        uint256 transportCost;      // Transportation cost
        uint256 margin;             // Total margin
        uint256 timestamp;          // When price was set
        address setter;             // Who set the price
    }

    // Fair price range for produce types
    struct FairPriceRange {
        uint256 minPrice;           // Minimum fair price
        uint256 maxPrice;           // Maximum fair price
        uint256 lastUpdated;        // Last update timestamp
        bool isActive;              // Whether range is active
    }

    // Market data for price discovery
    struct MarketData {
        uint256 averagePrice;       // Average market price
        uint256 priceVariance;      // Price variance
        uint256 volume;             // Trading volume
        uint256 lastUpdated;        // Last update timestamp
    }

    // State variables
    mapping(uint256 => PriceInfo) public batchPrices; // batchId => price info
    mapping(string => FairPriceRange) public fairPriceRanges; // produceType => fair range
    mapping(string => MarketData) public marketData; // produceType => market data
    
    // Price history for analytics
    mapping(string => uint256[]) public priceHistory; // produceType => price history
    mapping(string => uint256) public priceHistoryIndex; // produceType => current index
    
    // Constants
    uint256 public constant MAX_MARGIN_PERCENTAGE = 50; // Maximum 50% margin
    uint256 public constant PRICE_HISTORY_LIMIT = 1000; // Maximum price history entries
    
    // Events
    event PriceSet(
        uint256 indexed batchId,
        uint256 farmGatePrice,
        uint256 wholesalePrice,
        uint256 retailPrice,
        address indexed setter
    );
    
    event FairPriceRangeUpdated(
        string indexed produceType,
        uint256 minPrice,
        uint256 maxPrice,
        address indexed setter
    );
    
    event MarketDataUpdated(
        string indexed produceType,
        uint256 averagePrice,
        uint256 volume,
        address indexed updater
    );
    
    event PriceViolationDetected(
        uint256 indexed batchId,
        string violationType,
        uint256 actualPrice,
        uint256 fairPrice,
        address indexed reporter
    );

    // Modifiers
    modifier validPrice(uint256 _price) {
        require(_price > 0, "Price must be greater than 0");
        _;
    }
    
    modifier validMargin(uint256 _farmPrice, uint256 _retailPrice) {
        uint256 margin = ((_retailPrice - _farmPrice) * 100) / _farmPrice;
        require(margin <= MAX_MARGIN_PERCENTAGE, "Margin exceeds maximum allowed");
        _;
    }

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Set comprehensive pricing for a batch
     * @param _batchId Batch ID
     * @param _farmGatePrice Price paid to farmer
     * @param _wholesalePrice Price at wholesaler
     * @param _retailPrice Final retail price
     * @param _transportCost Transportation cost
     */
    function setBatchPricing(
        uint256 _batchId,
        uint256 _farmGatePrice,
        uint256 _wholesalePrice,
        uint256 _retailPrice,
        uint256 _transportCost
    ) external onlyRole(WHOLESALER_ROLE) validPrice(_farmGatePrice) validPrice(_retailPrice) {
        require(_wholesalePrice >= _farmGatePrice, "Wholesale price must be >= farm gate price");
        require(_retailPrice >= _wholesalePrice, "Retail price must be >= wholesale price");
        
        // Validate margin
        validMargin(_farmGatePrice, _retailPrice);
        
        uint256 margin = _retailPrice - _farmGatePrice;
        
        batchPrices[_batchId] = PriceInfo({
            farmGatePrice: _farmGatePrice,
            wholesalePrice: _wholesalePrice,
            retailPrice: _retailPrice,
            transportCost: _transportCost,
            margin: margin,
            timestamp: block.timestamp,
            setter: msg.sender
        });
        
        emit PriceSet(_batchId, _farmGatePrice, _wholesalePrice, _retailPrice, msg.sender);
    }

    /**
     * @dev Update retail price (only by retailer)
     * @param _batchId Batch ID
     * @param _newRetailPrice New retail price
     */
    function updateRetailPrice(uint256 _batchId, uint256 _newRetailPrice) 
        external 
        onlyRole(RETAILER_ROLE) 
        validPrice(_newRetailPrice) 
    {
        require(batchPrices[_batchId].timestamp > 0, "Batch pricing not set");
        
        uint256 farmGatePrice = batchPrices[_batchId].farmGatePrice;
        validMargin(farmGatePrice, _newRetailPrice);
        
        batchPrices[_batchId].retailPrice = _newRetailPrice;
        batchPrices[_batchId].margin = _newRetailPrice - farmGatePrice;
        batchPrices[_batchId].timestamp = block.timestamp;
        batchPrices[_batchId].setter = msg.sender;
        
        emit PriceSet(_batchId, farmGatePrice, batchPrices[_batchId].wholesalePrice, _newRetailPrice, msg.sender);
    }

    /**
     * @dev Set fair price range for a produce type (only government)
     * @param _produceType Type of produce
     * @param _minPrice Minimum fair price
     * @param _maxPrice Maximum fair price
     */
    function setFairPriceRange(
        string memory _produceType,
        uint256 _minPrice,
        uint256 _maxPrice
    ) external onlyRole(GOVERNMENT_ROLE) validPrice(_minPrice) validPrice(_maxPrice) {
        require(_maxPrice >= _minPrice, "Max price must be >= min price");
        
        fairPriceRanges[_produceType] = FairPriceRange({
            minPrice: _minPrice,
            maxPrice: _maxPrice,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        emit FairPriceRangeUpdated(_produceType, _minPrice, _maxPrice, msg.sender);
    }

    /**
     * @dev Update market data for price discovery
     * @param _produceType Type of produce
     * @param _averagePrice Average market price
     * @param _volume Trading volume
     */
    function updateMarketData(
        string memory _produceType,
        uint256 _averagePrice,
        uint256 _volume
    ) external onlyRole(PRICING_ORACLE_ROLE) validPrice(_averagePrice) {
        marketData[_produceType] = MarketData({
            averagePrice: _averagePrice,
            priceVariance: _calculatePriceVariance(_produceType, _averagePrice),
            volume: _volume,
            lastUpdated: block.timestamp
        });
        
        // Add to price history
        _addToPriceHistory(_produceType, _averagePrice);
        
        emit MarketDataUpdated(_produceType, _averagePrice, _volume, msg.sender);
    }

    /**
     * @dev Check if pricing is fair and report violations
     * @param _batchId Batch ID to check
     * @param _produceType Type of produce
     * @return isFair Whether pricing is fair
     * @return violationType Type of violation if any
     */
    function checkFairPricing(uint256 _batchId, string memory _produceType) 
        external 
        view 
        returns (bool isFair, string memory violationType) 
    {
        require(batchPrices[_batchId].timestamp > 0, "Batch pricing not set");
        
        PriceInfo memory priceInfo = batchPrices[_batchId];
        FairPriceRange memory fairRange = fairPriceRanges[_produceType];
        
        if (!fairRange.isActive) {
            return (true, "NO_FAIR_RANGE_SET");
        }
        
        // Check farm gate price
        if (priceInfo.farmGatePrice < fairRange.minPrice) {
            return (false, "FARM_GATE_BELOW_MIN");
        }
        
        if (priceInfo.farmGatePrice > fairRange.maxPrice) {
            return (false, "FARM_GATE_ABOVE_MAX");
        }
        
        // Check retail price
        if (priceInfo.retailPrice < fairRange.minPrice) {
            return (false, "RETAIL_BELOW_MIN");
        }
        
        if (priceInfo.retailPrice > fairRange.maxPrice) {
            return (false, "RETAIL_ABOVE_MAX");
        }
        
        // Check margin
        uint256 marginPercentage = (priceInfo.margin * 100) / priceInfo.farmGatePrice;
        if (marginPercentage > MAX_MARGIN_PERCENTAGE) {
            return (false, "MARGIN_TOO_HIGH");
        }
        
        return (true, "FAIR");
    }

    /**
     * @dev Get price information for a batch
     * @param _batchId Batch ID
     * @return Price information
     */
    function getBatchPricing(uint256 _batchId) external view returns (PriceInfo memory) {
        require(batchPrices[_batchId].timestamp > 0, "Batch pricing not set");
        return batchPrices[_batchId];
    }

    /**
     * @dev Get fair price range for a produce type
     * @param _produceType Type of produce
     * @return Fair price range
     */
    function getFairPriceRange(string memory _produceType) external view returns (FairPriceRange memory) {
        return fairPriceRanges[_produceType];
    }

    /**
     * @dev Get market data for a produce type
     * @param _produceType Type of produce
     * @return Market data
     */
    function getMarketData(string memory _produceType) external view returns (MarketData memory) {
        return marketData[_produceType];
    }

    /**
     * @dev Get price history for a produce type
     * @param _produceType Type of produce
     * @param _limit Number of recent prices to return
     * @return Array of recent prices
     */
    function getPriceHistory(string memory _produceType, uint256 _limit) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory history = priceHistory[_produceType];
        uint256 length = history.length;
        
        if (_limit >= length) {
            return history;
        }
        
        uint256[] memory recentPrices = new uint256[](_limit);
        uint256 startIndex = length - _limit;
        
        for (uint256 i = 0; i < _limit; i++) {
            recentPrices[i] = history[startIndex + i];
        }
        
        return recentPrices;
    }

    /**
     * @dev Internal function to calculate price variance
     */
    function _calculatePriceVariance(string memory _produceType, uint256 _currentPrice) 
        internal 
        view 
        returns (uint256) 
    {
        uint256[] memory history = priceHistory[_produceType];
        if (history.length == 0) return 0;
        
        uint256 sum = 0;
        uint256 count = 0;
        
        // Calculate average from recent history
        uint256 startIndex = history.length > 10 ? history.length - 10 : 0;
        for (uint256 i = startIndex; i < history.length; i++) {
            sum += history[i];
            count++;
        }
        
        if (count == 0) return 0;
        
        uint256 average = sum / count;
        uint256 variance = _currentPrice > average ? 
            ((_currentPrice - average) * 100) / average : 
            ((average - _currentPrice) * 100) / average;
        
        return variance;
    }

    /**
     * @dev Internal function to add price to history
     */
    function _addToPriceHistory(string memory _produceType, uint256 _price) internal {
        uint256[] storage history = priceHistory[_produceType];
        
        if (history.length >= PRICE_HISTORY_LIMIT) {
            // Remove oldest entry
            for (uint256 i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }
        
        history.push(_price);
    }
}
