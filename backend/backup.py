"""
Database backup script.
Run manually or schedule with Windows Task Scheduler.
Usage: python backup.py
"""
import os
import subprocess
import datetime
from dotenv import load_dotenv

load_dotenv()

BACKUP_DIR = "backups"
DATABASE_URL = os.getenv("DATABASE_URL", "")

def create_backup():
    os.makedirs(BACKUP_DIR, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUP_DIR, f"certverify_backup_{timestamp}.sql")

    # Parse DATABASE_URL
    # postgresql://postgres:password@localhost:5432/credverify
    try:
        parts = DATABASE_URL.replace("postgresql://", "")
        user_pass, rest = parts.split("@")
        username, password = user_pass.split(":")
        host_port, database = rest.split("/")
        if ":" in host_port:
            host, port = host_port.split(":")
        else:
            host, port = host_port, "5432"
    except Exception as e:
        print(f"Could not parse DATABASE_URL: {e}")
        return False

    env = os.environ.copy()
    env["PGPASSWORD"] = password

    cmd = [
        "pg_dump",
        "-h", host,
        "-p", port,
        "-U", username,
        "-d", database,
        "-f", backup_file,
        "--no-password"
    ]

    try:
        result = subprocess.run(
            cmd, env=env,
            capture_output=True, text=True
        )

        if result.returncode == 0:
            size = os.path.getsize(backup_file)
            print(f"Backup created: {backup_file}")
            print(f"Size: {size / 1024:.1f} KB")

            # Keep only last 7 backups
            backups = sorted([
                f for f in os.listdir(BACKUP_DIR)
                if f.endswith('.sql')
            ])
            while len(backups) > 7:
                oldest = os.path.join(BACKUP_DIR, backups.pop(0))
                os.remove(oldest)
                print(f"Removed old backup: {oldest}")

            return True
        else:
            print(f"Backup failed: {result.stderr}")
            return False

    except FileNotFoundError:
        print("pg_dump not found. Make sure PostgreSQL bin is in PATH.")
        print(f"Add to PATH: C:\\Program Files\\PostgreSQL\\17\\bin")
        return False

if __name__ == "__main__":
    print("CertVerify — Database Backup")
    print("=" * 40)
    success = create_backup()
    if success:
        print("\nBackup completed successfully! ✅")
    else:
        print("\nBackup failed! ❌")