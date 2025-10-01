// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Pricing
 * @dev Contract for managing fair pricing and price validation
 */
contract Pricing is AccessControl {
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");

    uint256 public constant MAX_MARGIN_PERCENTAGE = 50; // max 50% margin

    // Fair price range for each produce type
    struct FairPriceRange {
        uint256 minPrice;
        uint256 maxPrice;
        bool isActive;
    }

    mapping(bytes32 => FairPriceRange) public fairPriceRanges; // produceTypeHash => range

    event FairPriceRangeUpdated(string produceType, uint256 minPrice, uint256 maxPrice);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Set fair price range for a produce type
     */
    function setFairPriceRange(
        string memory _produceType,
        uint256 _minPrice,
        uint256 _maxPrice
    ) external onlyRole(GOVERNMENT_ROLE) {
        require(_minPrice > 0 && _maxPrice > 0, "Prices must be > 0");
        require(_maxPrice >= _minPrice, "Max must be >= min");

        bytes32 key = keccak256(abi.encodePacked(_produceType));
        fairPriceRanges[key] = FairPriceRange({
            minPrice: _minPrice,
            maxPrice: _maxPrice,
            isActive: true
        });

        emit FairPriceRangeUpdated(_produceType, _minPrice, _maxPrice);
    }

    /**
     * @dev Validate if a price is within fair range
     */
    function validatePrice(
        string memory _produceType,
        uint256 _farmPrice,
        uint256 _retailPrice
    ) external view returns (bool) {
        bytes32 key = keccak256(abi.encodePacked(_produceType));
        FairPriceRange memory range = fairPriceRanges[key];

        if (!range.isActive) return true;

        uint256 margin = (_retailPrice - _farmPrice) * 100 / _farmPrice;
        if (margin > MAX_MARGIN_PERCENTAGE) return false;

        if (_farmPrice < range.minPrice || _farmPrice > range.maxPrice) return false;
        if (_retailPrice < range.minPrice || _retailPrice > range.maxPrice) return false;

        return true;
    }
}
