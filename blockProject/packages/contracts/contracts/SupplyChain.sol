// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Pricing.sol";

/**
 * @title SupplyChain
 * @dev Tracks agricultural produce from farm to consumer
 */
contract SupplyChain is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant TRANSPORTER_ROLE = keccak256("TRANSPORTER_ROLE");
    bytes32 public constant WHOLESALER_ROLE = keccak256("WHOLESALER_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");

    // Batch status
    enum BatchStatus { REGISTERED, IN_TRANSIT, AT_WHOLESALER, AT_RETAILER, SOLD_TO_CONSUMER }

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
        string ipfsHash;
        bool isActive;
        uint256 farmPrice;
        uint256 retailPrice;
    }

    Counters.Counter private _batchCounter;
    mapping(uint256 => Batch) public batches;

    Pricing public pricingContract;

    event BatchCreated(uint256 batchId, address farmer, string produceType);
    event BatchStatusUpdated(uint256 batchId, BatchStatus oldStatus, BatchStatus newStatus);
    event BatchPriced(uint256 batchId, uint256 farmPrice, uint256 retailPrice);

    constructor(address _pricingContract) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        pricingContract = Pricing(_pricingContract);
    }

    function registerBatch(
        string memory _produceType,
        uint256 _quantity,
        uint256 _harvestDate,
        string memory _location,
        string memory _qualityGrade,
        string memory _ipfsHash
    ) external onlyRole(FARMER_ROLE) returns (uint256) {
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
            isActive: true,
            farmPrice: 0,
            retailPrice: 0
        });

        emit BatchCreated(batchId, msg.sender, _produceType);
        return batchId;
    }

    function updateBatchStatus(uint256 _batchId, BatchStatus _newStatus) external {
        Batch storage batch = batches[_batchId];
        BatchStatus oldStatus = batch.status;

        require(_isValidStatusTransition(oldStatus, _newStatus), "Invalid status transition");
        require(_isAuthorizedForStatus(_newStatus), "Not authorized for this status");

        batch.status = _newStatus;
        batch.updatedAt = block.timestamp;

        emit BatchStatusUpdated(_batchId, oldStatus, _newStatus);
    }

    function setBatchPrice(
        uint256 _batchId,
        uint256 _farmPrice,
        uint256 _retailPrice
    ) external onlyRole(WHOLESALER_ROLE) {
        Batch storage batch = batches[_batchId];

        bool isValid = pricingContract.validatePrice(batch.produceType, _farmPrice, _retailPrice);
        require(isValid, "Price not valid");

        batch.farmPrice = _farmPrice;
        batch.retailPrice = _retailPrice;

        emit BatchPriced(_batchId, _farmPrice, _retailPrice);
    }

    function _isValidStatusTransition(BatchStatus _from, BatchStatus _to) internal pure returns (bool) {
        if (_from == BatchStatus.REGISTERED && _to == BatchStatus.IN_TRANSIT) return true;
        if (_from == BatchStatus.IN_TRANSIT && _to == BatchStatus.AT_WHOLESALER) return true;
        if (_from == BatchStatus.AT_WHOLESALER && _to == BatchStatus.AT_RETAILER) return true;
        if (_from == BatchStatus.AT_RETAILER && _to == BatchStatus.SOLD_TO_CONSUMER) return true;
        return false;
    }

    function _isAuthorizedForStatus(BatchStatus _status) internal view returns (bool) {
        if (_status == BatchStatus.IN_TRANSIT) return hasRole(TRANSPORTER_ROLE, msg.sender);
        if (_status == BatchStatus.AT_WHOLESALER) return hasRole(WHOLESALER_ROLE, msg.sender);
        if (_status == BatchStatus.AT_RETAILER || _status == BatchStatus.SOLD_TO_CONSUMER)
            return hasRole(RETAILER_ROLE, msg.sender);
        return false;
    }
}
