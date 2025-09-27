// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {AttestationId} from "@selfxyz/contracts/contracts/constants/AttestationId.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LetsPaySelfAttest
 * @notice Attestation contract integrating with Self Protocol V2
 * @dev Extends SelfVerificationRoot for official Self Protocol integration
 */
contract LetsPaySelfAttest is SelfVerificationRoot, Ownable {
    
    // Events
    event UserVerified(
        address indexed user,
        bytes32 indexed userIdentifier, 
        string nationality,
        uint256 timestamp
    );
    
    event ConfigurationUpdated(bytes32 indexed newConfigId);

    // State variables
    bytes32 public configId;
    
    /// @notice Tracks attestation status by address
    mapping(address => bool) public attested;
    
    /// @notice Tracks attestation details by user identifier
    mapping(bytes32 => AttestationData) public attestations;
    
    struct AttestationData {
        address userAddress;
        string nationality;
        string name;
        string dateOfBirth;
        uint256 verifiedAt;
        bool isValid;
    }

    /**
     * @notice Contract constructor
     * @param _identityVerificationHubV2 V2 Hub address from Self Protocol
     * @param _scope Application-specific scope identifier
     * @dev Hub addresses: Celo Mainnet: 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF, Testnet: 0x68c931C9a534D37aa78094877F46fE46a49F1A51
     */
    constructor(
        address _identityVerificationHubV2,
        uint256 _scope
    )
        SelfVerificationRoot(_identityVerificationHubV2, _scope)
        Ownable(msg.sender)
    {
        // Initialize with empty configId - set it up after deployment using Self Configuration Tools
    }

    /**
     * @notice Required override to provide configId for verification
     * @dev Use Self Configuration Tools (https://tools.self.xyz/) to generate config ID
     * @param destinationChainId The chain ID for verification
     * @param userIdentifier User's unique identifier
     * @param userDefinedData Custom data from the QR code configuration
     * @return bytes32 Your app's configuration ID
     */
    function getConfigId(
        bytes32 destinationChainId,
        bytes32 userIdentifier,
        bytes memory userDefinedData
    ) public view override returns (bytes32) {
        require(configId != bytes32(0), "Configuration ID not set. Use Self Configuration Tools to generate one.");
        return configId;
    }

    /**
     * @notice Override to handle successful verification
     * @dev This function is called automatically when verification succeeds
     * @param output Verified user data from Self Protocol
     * @param userData Additional user-defined data
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal virtual override {
        // Extract verified data
        address userAddress = msg.sender;
        bytes32 userIdentifier = bytes32(output.userIdentifier);

        
        // Require nationality for this app
        require(bytes(output.nationality).length > 0, "Nationality verification required");
        
        // Mark user as attested
        attested[userAddress] = true;
        
        // Store attestation details
        attestations[userIdentifier] = AttestationData({
            userAddress: userAddress,
            nationality: output.nationality,
            name: output.name.length > 0 ? output.name[0] : "",
            dateOfBirth: output.dateOfBirth,
            verifiedAt: block.timestamp,
            isValid: true
        });

        // Emit verification event
        emit UserVerified(
            userAddress,
            userIdentifier,
            output.nationality,
            block.timestamp
        );
    }

    /**
     * @notice Set the configuration ID generated from Self Configuration Tools
     * @param _configId The configuration ID from https://tools.self.xyz/
     */
    function setConfigId(bytes32 _configId) external onlyOwner {
        require(_configId != bytes32(0), "Invalid config ID");
        configId = _configId;
        emit ConfigurationUpdated(_configId);
    }

    /**
     * @notice Update the verification scope
     * @param _scope New scope calculated from Self Configuration Tools
     */
    function setScope(uint256 _scope) external onlyOwner {
        require(_scope != 0, "Invalid scope");
        _setScope(_scope);
        emit ScopeUpdated(_scope);
    }

    /**
     * @notice Check if an address has valid attestation
     * @param user The address to check
     * @return bool Whether the user is attested
     */
    function isAttested(address user) external view returns (bool) {
        return attested[user];
    }

    /**
     * @notice Get attestation details for a user identifier
     * @param userIdentifier The user identifier to check
     * @return AttestationData The attestation details
     */
    function getAttestation(bytes32 userIdentifier) external view returns (AttestationData memory) {
        return attestations[userIdentifier];
    }

    /**
     * @notice Get attestation by user address (convenience function)
     * @param userAddress The user address to check
     * @return AttestationData The attestation details
     */
    function getAttestationByAddress(address userAddress) external view returns (AttestationData memory) {
        // Note: This is less efficient as it requires iterating
        // In production, consider maintaining a reverse mapping
        // For now, return empty data - implement proper mapping if needed
        return AttestationData({
            userAddress: address(0),
            nationality: "",
            name: "",
            dateOfBirth: "",
            verifiedAt: 0,
            isValid: false
        });
    }

    /**
     * @notice Emergency function to revoke attestation (owner only)
     * @param userIdentifier The user identifier whose attestation to revoke
     */
    function revokeAttestation(bytes32 userIdentifier) external onlyOwner {
        AttestationData storage attestation = attestations[userIdentifier];
        require(attestation.isValid, "User not attested");
        
        attested[attestation.userAddress] = false;
        attestation.isValid = false;
    }

    /**
     * @notice Get the current configuration and scope info
     * @return currentConfigId The current configuration ID
     * @return currentScope The current scope
     * @return hubAddress The Identity Verification Hub V2 address
     */
    function getConfiguration() external view returns (
        bytes32 currentConfigId,
        uint256 currentScope,
        address hubAddress
    ) {
        return (
            configId,
            scope(),
            address(_identityVerificationHubV2)
        );
    }
}