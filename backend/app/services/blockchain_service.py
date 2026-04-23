from web3 import Web3
from web3.exceptions import ContractLogicError
import hashlib
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Contract ABI - the interface to interact with our smart contract
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_certificateId", "type": "string"},
            {"internalType": "string", "name": "_certificateHash", "type": "string"},
            {"internalType": "string", "name": "_holderName", "type": "string"},
            {"internalType": "string", "name": "_institutionName", "type": "string"},
            {"internalType": "string", "name": "_courseName", "type": "string"},
            {"internalType": "string", "name": "_issueDate", "type": "string"}
        ],
        "name": "issueCertificate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_certificateId", "type": "string"}
        ],
        "name": "getCertificate",
        "outputs": [
            {"internalType": "string", "name": "certificateId", "type": "string"},
            {"internalType": "string", "name": "certificateHash", "type": "string"},
            {"internalType": "string", "name": "holderName", "type": "string"},
            {"internalType": "string", "name": "institutionName", "type": "string"},
            {"internalType": "string", "name": "courseName", "type": "string"},
            {"internalType": "string", "name": "issueDate", "type": "string"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "issuedBy", "type": "address"},
            {"internalType": "bool", "name": "isValid", "type": "bool"},
            {"internalType": "bool", "name": "isRevoked", "type": "bool"},
            {"internalType": "string", "name": "revocationReason", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_certificateId", "type": "string"}
        ],
        "name": "verifyCertificate",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_certificateId", "type": "string"},
            {"internalType": "string", "name": "_reason", "type": "string"}
        ],
        "name": "revokeCertificate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_certificateId", "type": "string"}
        ],
        "name": "doesCertificateExist",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_certificateId", "type": "string"},
            {"internalType": "string", "name": "_hash", "type": "string"}
        ],
        "name": "verifyHash",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

class BlockchainService:
    def __init__(self):
        from dotenv import load_dotenv
        load_dotenv()

        # ENV variables
        self.contract_address = os.getenv("CONTRACT_ADDRESS")
        self.private_key = os.getenv("PRIVATE_KEY")

        amoy_url = os.getenv("POLYGON_RPC_URL", "https://rpc-amoy.polygon.technology")
        local_url = os.getenv("LOCAL_RPC_URL", "http://127.0.0.1:8545")

        # Connect to Amoy
        self.w3 = Web3(Web3.HTTPProvider(amoy_url))

        if not self.w3.is_connected():
            print("Amoy not available, trying local node...")
            self.w3 = Web3(Web3.HTTPProvider(local_url))

        # Final connection check
        if self.w3.is_connected() and self.contract_address:
            try:
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=CONTRACT_ABI
                )

                if self.private_key:
                    self.account = self.w3.eth.account.from_key(self.private_key).address
                else:
                    accounts = self.w3.eth.accounts
                    self.account = accounts[0] if accounts else None

                print("✅ Blockchain connected")
                print(f"Account: {self.account}")

            except Exception as e:
                print(f"❌ Contract setup failed: {e}")
                self.contract = None
                self.account = None
        else:
            print("⚠️ Blockchain not connected")
            self.contract = None
            self.account = None
    
    def is_connected(self) -> bool:
        return self.w3.is_connected() and self.contract is not None
    
    def generate_certificate_hash(self, certificate_data: dict) -> str:
        """Generate SHA-256 hash of certificate data"""
        data_string = json.dumps(certificate_data, sort_keys=True)
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    def store_certificate(
        self,
        certificate_id: str,
        holder_name: str,
        institution_name: str,
        course_name: str,
        issue_date: str,
        file_path: str = None
    ) -> dict:
        """Store certificate hash on blockchain"""
        
        if not self.is_connected():
            return {
                "success": False,
                "message": "Blockchain not connected",
                "tx_hash": None,
                "certificate_hash": None
            }
        
        try:
            # Generate hash
            cert_data = {
                "certificate_id": certificate_id,
                "holder_name": holder_name,
                "institution_name": institution_name,
                "course_name": course_name,
                "issue_date": issue_date
            }
            cert_hash = self.generate_certificate_hash(cert_data)
            
            # Build transaction
            tx = self.contract.functions.issueCertificate(
                certificate_id,
                cert_hash,
                holder_name,
                institution_name,
                course_name,
                issue_date
            ).build_transaction({
                'from': self.account,
                'nonce': self.w3.eth.get_transaction_count(self.account),
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            if self.private_key:
                signed_tx = self.w3.eth.account.sign_transaction(
                    tx, self.private_key
                )
                tx_hash = self.w3.eth.send_raw_transaction(
                    signed_tx.raw_transaction
                )
            else:
                # Local node - no signing needed
                tx_hash = self.w3.eth.send_transaction(tx)
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                "success": True,
                "tx_hash": tx_hash.hex(),
                "certificate_hash": cert_hash,
                "block_number": receipt.blockNumber,
                "message": "Certificate stored on blockchain"
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Blockchain error: {str(e)}",
                "tx_hash": None,
                "certificate_hash": None
            }
    
    def verify_on_chain(self, certificate_id: str) -> dict:
        """Verify certificate on blockchain"""
        
        if not self.is_connected():
            return {
                "success": False,
                "is_valid": False,
                "message": "Blockchain not connected"
            }
        
        try:
            exists = self.contract.functions.doesCertificateExist(
                certificate_id
            ).call()
            
            if not exists:
                return {
                    "success": True,
                    "is_valid": False,
                    "message": "Certificate not found on blockchain"
                }
            
            cert_data = self.contract.functions.getCertificate(
                certificate_id
            ).call()
            
            return {
                "success": True,
                "is_valid": cert_data[8],
                "is_revoked": cert_data[9],
                "certificate_hash": cert_data[1],
                "holder_name": cert_data[2],
                "institution_name": cert_data[3],
                "timestamp": cert_data[6],
                "issued_by": cert_data[7],
                "revocation_reason": cert_data[10],
                "message": "Certificate verified on blockchain"
            }
            
        except Exception as e:
            return {
                "success": False,
                "is_valid": False,
                "message": f"Verification error: {str(e)}"
            }
    
    def revoke_on_chain(self, certificate_id: str, reason: str) -> dict:
        """Revoke certificate on blockchain"""
        
        if not self.is_connected():
            return {
                "success": False,
                "message": "Blockchain not connected"
            }
        
        try:
            tx = self.contract.functions.revokeCertificate(
                certificate_id,
                reason
            ).build_transaction({
                'from': self.account,
                'nonce': self.w3.eth.get_transaction_count(self.account),
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            if self.private_key:
                signed_tx = self.w3.eth.account.sign_transaction(
                    tx, self.private_key
                )
                tx_hash = self.w3.eth.send_raw_transaction(
                    signed_tx.raw_transaction
                )
            else:
                tx_hash = self.w3.eth.send_transaction(tx)
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                "success": True,
                "tx_hash": tx_hash.hex(),
                "message": "Certificate revoked on blockchain"
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Revocation error: {str(e)}"
            }

# Single instance
blockchain_service = BlockchainService()