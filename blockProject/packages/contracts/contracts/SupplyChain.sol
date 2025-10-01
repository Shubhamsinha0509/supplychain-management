// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SupplyChain
 * @dev Main contract for tracking agricultural produce from farm to consumer
 * @author Blockchain Supply Chain Team
 */
contract SupplyChain is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant TRANSPORTER_ROLE = keccak256("TRANSPORTER_ROLE");
    bytes32 public constant WHOLESALER_ROLE = keccak256("WHOLESALER_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");

    // Batch status enumeration
    enum BatchStatus {
        REGISTERED,      // 0 - Initial registration by farmer
        IN_TRANSIT,      // 1 - Being transported
        AT_WHOLESALER,   // 2 - Received by wholesaler
        AT_RETAILER,     // 3 - Received by retailer
        SOLD_TO_CONSUMER // 4 - Final sale to consumer
    }

    // Batch information structure
    struct Batch {
        uint256 batchId;
        address farmer;
        string produceType;
        uint256 quantity;
        uint256 harvestDate;
        string location;
        string qualityGrade;
        BatchStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        string ipfsHash; // Hash of detailed information stored on IPFS
        bool isActive;
    }

    // Supply chain event structure
    struct SupplyChainEvent {
        uint256 eventId;
        uint256 batchId;
        address actor;
        string eventType;
        string description;
        uint256 timestamp;
        string location;
        string ipfsHash; // Additional data stored on IPFS
    }

    // State variables
    Counters.Counter private _batchCounter;
    Counters.Counter private _eventCounter;
    
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => SupplyChainEvent[]) public batchEvents;
    mapping(string => uint256) public batchIdByHash; // IPFS hash to batch ID mapping
    
    // Pricing information
    mapping(uint256 => uint256) public batchPrices; // batchId => price in wei
    mapping(uint256 => uint256) public fairPriceRange; // produceType hash => max fair price
    
    // Events
    event BatchCreated(
        uint256 indexed batchId,
        address indexed farmer,
        string produceType,
        uint256 quantity,
        string ipfsHash
    );
    
    event BatchStatusUpdated(
        uint256 indexed batchId,
        BatchStatus oldStatus,
        BatchStatus newStatus,
        address indexed actor
    );
    
    event SupplyChainEventAdded(
        uint256 indexed batchId,
        uint256 indexed eventId,
        address indexed actor,
        string eventType
    );
    
    event PriceSet(
        uint256 indexed batchId,
        uint256 price,
        address indexed setter
    );
    
    event FairPriceRangeUpdated(
        string indexed produceType,
        uint256 maxPrice
    );

    // Modifiers
    modifier validBatchId(uint256 _batchId) {
        require(_batchId > 0 && _batchId <= _batchCounter.current(), "Invalid batch ID");
        require(batches[_batchId].isActive, "Batch is not active");
        _;
    }
    
    modifier onlyBatchOwner(uint256 _batchId) {
        require(batches[_batchId].farmer == msg.sender, "Not the batch owner");
        _;
    }

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new batch of produce
     * @param _produceType Type of produce (e.g., "Tomatoes", "Wheat")
     * @param _quantity Quantity in appropriate units
     * @param _harvestDate Unix timestamp of harvest
     * @param _location Farm location
     * @param _qualityGrade Quality grade (e.g., "A", "B", "Organic")
     * @param _ipfsHash IPFS hash containing detailed information
     */
    function registerBatch(
        string memory _produceType,
        uint256 _quantity,
        uint256 _harvestDate,
        string memory _location,
        string memory _qualityGrade,
        string memory _ipfsHash
    ) external onlyRole(FARMER_ROLE) returns (uint256) {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_harvestDate <= block.timestamp, "Harvest date cannot be in the future");
        require(bytes(_ipfsHash).length > 0, "IPFS hash is required");
        
        _batchCounter.increment();
        uint256 batchId = _batchCounter.current();
        
        batches[batchId] = Batch({
            batchId: batchId,
            farmer: msg.sender,
            produceType: _produceType,
            quantity: _quantity,
            harvestDate: _harvestDate,
            location: _location,
            qualityGrade: _qualityGrade,
            status: BatchStatus.REGISTERED,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            ipfsHash: _ipfsHash,
            isActive: true
        });
        
        batchIdByHash[_ipfsHash] = batchId;
        
        emit BatchCreated(batchId, msg.sender, _produceType, _quantity, _ipfsHash);
        
        return batchId;
    }

    /**
     * @dev Update batch status (only by authorized actors)
     * @param _batchId Batch ID to update
     * @param _newStatus New status for the batch
     * @param _description Description of the status change
     * @param _location Current location
     * @param _ipfsHash Additional data stored on IPFS
     */
    function updateBatchStatus(
        uint256 _batchId,
        BatchStatus _newStatus,
        string memory _description,
        string memory _location,
        string memory _ipfsHash
    ) external validBatchId(_batchId) {
        Batch storage batch = batches[_batchId];
        BatchStatus oldStatus = batch.status;
        
        // Validate status transition
        require(_isValidStatusTransition(oldStatus, _newStatus), "Invalid status transition");
        
        // Check authorization based on new status
        require(_isAuthorizedForStatus(_newStatus), "Not authorized for this status");
        
        batch.status = _newStatus;
        batch.updatedAt = block.timestamp;
        
        // Add event to batch history
        _addBatchEvent(_batchId, _description, _location, _ipfsHash);
        
        emit BatchStatusUpdated(_batchId, oldStatus, _newStatus, msg.sender);
    }

    /**
     * @dev Set price for a batch (only by wholesaler or retailer)
     * @param _batchId Batch ID
     * @param _price Price in wei
     */
    function setBatchPrice(uint256 _batchId, uint256 _price) 
        external 
        validBatchId(_batchId) 
        onlyRole(WHOLESALER_ROLE) 
    {
        require(_price > 0, "Price must be greater than 0");
        
        // Check if price is within fair range
        string memory produceType = batches[_batchId].produceType;
        uint256 maxFairPrice = fairPriceRange[keccak256(abi.encodePacked(produceType))];
        
        if (maxFairPrice > 0) {
            require(_price <= maxFairPrice, "Price exceeds fair price range");
        }
        
        batchPrices[_batchId] = _price;
        emit PriceSet(_batchId, _price, msg.sender);
    }

    /**
     * @dev Set fair price range for a produce type (only government)
     * @param _produceType Type of produce
     * @param _maxPrice Maximum fair price in wei
     */
    function setFairPriceRange(string memory _produceType, uint256 _maxPrice) 
        external 
        onlyRole(GOVERNMENT_ROLE) 
    {
        require(_maxPrice > 0, "Max price must be greater than 0");
        
        fairPriceRange[keccak256(abi.encodePacked(_produceType))] = _maxPrice;
        emit FairPriceRangeUpdated(_produceType, _maxPrice);
    }

    /**
     * @dev Get batch information
     * @param _batchId Batch ID
     * @return Batch information
     */
    function getBatch(uint256 _batchId) external view validBatchId(_batchId) returns (Batch memory) {
        return batches[_batchId];
    }

    /**
     * @dev Get all events for a batch
     * @param _batchId Batch ID
     * @return Array of events
     */
    function getBatchEvents(uint256 _batchId) external view validBatchId(_batchId) returns (SupplyChainEvent[] memory) {
        return batchEvents[_batchId];
    }

    /**
     * @dev Get batch price
     * @param _batchId Batch ID
     * @return Price in wei
     */
    function getBatchPrice(uint256 _batchId) external view validBatchId(_batchId) returns (uint256) {
        return batchPrices[_batchId];
    }

    /**
     * @dev Get total number of batches
     * @return Total batch count
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchCounter.current();
    }

    /**
     * @dev Internal function to add event to batch history
     */
    function _addBatchEvent(
        uint256 _batchId,
        string memory _description,
        string memory _location,
        string memory _ipfsHash
    ) internal {
        _eventCounter.increment();
        uint256 eventId = _eventCounter.current();
        
        string memory eventType = _getEventTypeForStatus(batches[_batchId].status);
        
        SupplyChainEvent memory newEvent = SupplyChainEvent({
            eventId: eventId,
            batchId: _batchId,
            actor: msg.sender,
            eventType: eventType,
            description: _description,
            timestamp: block.timestamp,
            location: _location,
            ipfsHash: _ipfsHash
        });
        
        batchEvents[_batchId].push(newEvent);
        
        emit SupplyChainEventAdded(_batchId, eventId, msg.sender, eventType);
    }

    /**
     * @dev Check if status transition is valid
     */
    function _isValidStatusTransition(BatchStatus _from, BatchStatus _to) internal pure returns (bool) {
        if (_from == BatchStatus.REGISTERED && _to == BatchStatus.IN_TRANSIT) return true;
        if (_from == BatchStatus.IN_TRANSIT && _to == BatchStatus.AT_WHOLESALER) return true;
        if (_from == BatchStatus.AT_WHOLESALER && _to == BatchStatus.AT_RETAILER) return true;
        if (_from == BatchStatus.AT_RETAILER && _to == BatchStatus.SOLD_TO_CONSUMER) return true;
        return false;
    }

    /**
     * @dev Check if caller is authorized for the status
     */
    function _isAuthorizedForStatus(BatchStatus _status) internal view returns (bool) {
        if (_status == BatchStatus.IN_TRANSIT) {
            return hasRole(TRANSPORTER_ROLE, msg.sender);
        }
        if (_status == BatchStatus.AT_WHOLESALER) {
            return hasRole(WHOLESALER_ROLE, msg.sender);
        }
        if (_status == BatchStatus.AT_RETAILER) {
            return hasRole(RETAILER_ROLE, msg.sender);
        }
        if (_status == BatchStatus.SOLD_TO_CONSUMER) {
            return hasRole(RETAILER_ROLE, msg.sender);
        }
        return false;
    }

    /**
     * @dev Get event type string for status
     */
    function _getEventTypeForStatus(BatchStatus _status) internal pure returns (string memory) {
        if (_status == BatchStatus.IN_TRANSIT) return "TRANSPORT_STARTED";
        if (_status == BatchStatus.AT_WHOLESALER) return "RECEIVED_BY_WHOLESALER";
        if (_status == BatchStatus.AT_RETAILER) return "RECEIVED_BY_RETAILER";
        if (_status == BatchStatus.SOLD_TO_CONSUMER) return "SOLD_TO_CONSUMER";
        return "UNKNOWN";
    }
}
