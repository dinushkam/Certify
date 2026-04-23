// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateRegistry {
    
    // Certificate structure
    struct Certificate {
        string certificateId;
        string certificateHash;
        string holderName;
        string institutionName;
        string courseName;
        string issueDate;
        uint256 timestamp;
        address issuedBy;
        bool isValid;
        bool isRevoked;
        string revocationReason;
    }
    
    // Storage
    mapping(string => Certificate) private certificates;
    mapping(string => bool) private certificateExists;
    
    // Events
    event CertificateIssued(
        string indexed certificateId,
        string holderName,
        string institutionName,
        address issuedBy,
        uint256 timestamp
    );
    
    event CertificateRevoked(
        string indexed certificateId,
        string reason,
        uint256 timestamp
    );
    
    event CertificateVerified(
        string indexed certificateId,
        bool isValid,
        uint256 timestamp
    );
    
    // Issue a new certificate
    function issueCertificate(
        string memory _certificateId,
        string memory _certificateHash,
        string memory _holderName,
        string memory _institutionName,
        string memory _courseName,
        string memory _issueDate
    ) public {
        require(
            !certificateExists[_certificateId],
            "Certificate already exists"
        );
        
        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            certificateHash: _certificateHash,
            holderName: _holderName,
            institutionName: _institutionName,
            courseName: _courseName,
            issueDate: _issueDate,
            timestamp: block.timestamp,
            issuedBy: msg.sender,
            isValid: true,
            isRevoked: false,
            revocationReason: ""
        });
        
        certificateExists[_certificateId] = true;
        
        emit CertificateIssued(
            _certificateId,
            _holderName,
            _institutionName,
            msg.sender,
            block.timestamp
        );
    }
    
    // Verify a certificate
    function verifyCertificate(
        string memory _certificateId
    ) public returns (bool) {
        if (!certificateExists[_certificateId]) {
            return false;
        }
        
        Certificate memory cert = certificates[_certificateId];
        bool isValid = cert.isValid && !cert.isRevoked;
        
        emit CertificateVerified(
            _certificateId,
            isValid,
            block.timestamp
        );
        
        return isValid;
    }
    
    // Get certificate details
    function getCertificate(
        string memory _certificateId
    ) public view returns (
        string memory certificateId,
        string memory certificateHash,
        string memory holderName,
        string memory institutionName,
        string memory courseName,
        string memory issueDate,
        uint256 timestamp,
        address issuedBy,
        bool isValid,
        bool isRevoked,
        string memory revocationReason
    ) {
        require(
            certificateExists[_certificateId],
            "Certificate not found"
        );
        
        Certificate memory cert = certificates[_certificateId];
        
        return (
            cert.certificateId,
            cert.certificateHash,
            cert.holderName,
            cert.institutionName,
            cert.courseName,
            cert.issueDate,
            cert.timestamp,
            cert.issuedBy,
            cert.isValid,
            cert.isRevoked,
            cert.revocationReason
        );
    }
    
    // Revoke a certificate
    function revokeCertificate(
        string memory _certificateId,
        string memory _reason
    ) public {
        require(
            certificateExists[_certificateId],
            "Certificate not found"
        );
        require(
            !certificates[_certificateId].isRevoked,
            "Certificate already revoked"
        );
        
        certificates[_certificateId].isValid = false;
        certificates[_certificateId].isRevoked = true;
        certificates[_certificateId].revocationReason = _reason;
        
        emit CertificateRevoked(
            _certificateId,
            _reason,
            block.timestamp
        );
    }
    
    // Check if certificate exists
    function doesCertificateExist(
        string memory _certificateId
    ) public view returns (bool) {
        return certificateExists[_certificateId];
    }
    
    // Verify hash matches
    function verifyHash(
        string memory _certificateId,
        string memory _hash
    ) public view returns (bool) {
        if (!certificateExists[_certificateId]) {
            return false;
        }
        
        return keccak256(
            abi.encodePacked(certificates[_certificateId].certificateHash)
        ) == keccak256(abi.encodePacked(_hash));
    }
}