// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract SignatureVerifier {
    using ECDSA for bytes32;

    address public aiAgent = 0xE2B48E911562a221619533a5463975Fdd92E7fC7;

    struct DistributionData {
        address[] recipients;
        uint256[] amounts;
        uint256 totalAmount;
    }

    /**
     * @notice Decodes raw bytes into a DistributionData struct.
     * @param encodedData The encoded distribution data.
     * @return data The decoded DistributionData struct.
     */
    function decodeDistributionData(bytes memory encodedData) public pure returns (DistributionData memory data) {
        data = abi.decode(encodedData, (DistributionData));
    }

    /**
     * @notice Computes the hash of the given distribution data.
     * @param data The DistributionData struct.
     * @return The hash of the encoded distribution data.
     */
    function getDistributionDataHash(DistributionData memory data) public pure returns (bytes32) {
        return keccak256(abi.encode(data.recipients, data.amounts, data.totalAmount));
    }

    /**
     * @notice Verifies whether a given signature corresponds to a distribution data hash
     *         signed by the AI agent.
     * @param encodedData The encoded bytes of DistributionData struct.
     * @param signature The off-chain generated signature.
     * @return True if the signature is valid, false otherwise.
     */
    function verifySignature(bytes memory encodedData, bytes memory signature) public view returns (bool) {
        // Decode the input bytes into DistributionData struct
        DistributionData memory data = decodeDistributionData(encodedData);

        // Compute the hash of the struct
        bytes32 dataHash = getDistributionDataHash(data);
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(dataHash);
        address recoveredSigner = ethSignedHash.recover(signature);

        return recoveredSigner == aiAgent;
    }

    /**
     * @notice Updates the AI agent address.
     * @param newAgent The new AI agent address.
     */
    function updateAIAgent(address newAgent) public {
        require(newAgent != address(0), "Invalid address");
        aiAgent = newAgent;
    }
}
