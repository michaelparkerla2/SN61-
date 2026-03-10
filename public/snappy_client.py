"""
SNappY Client - Claw Bot Memory Integration
============================================

Persistent memory storage for Claw bot SN61 mining.
Track wins, rejections, plans, and what NOT to do.

SETUP:
------
1. Deploy SNappY to Vercel (click Publish in v0)
2. Copy your deployment URL (e.g., https://your-app.vercel.app)
3. Update SNAPPY_URL below with your URL
4. Add this file to your Claw bot project
5. Import and use the functions in your pipeline.py/crons

USAGE:
------
from snappy_client import store_log, retrieve_log, search_logs, get_history, github_backup

# After submission:
store_log("dfp_v7", {
    "type": "submission",
    "version": "v7",
    "status": "pending",
    "hash": "90b4b466...",
    "signals": ["font_enum", "raf_cadence"],
    "notes": "deterministic, no volatile"
})

# On rejection:
store_log("dfp_v7_reject", {
    "type": "rejection",
    "version": "v7",
    "status": "rejected",
    "score": 0.4,
    "reason": "high fragmentation from performance.now",
    "fix": "remove volatile timestamp, use deterministic hash"
})

# On win:
store_log("dfp_v7_win", {
    "type": "win",
    "version": "v7",
    "status": "accepted",
    "score": 0.85,
    "signals": ["font_enum", "canvas_hash"],
    "notes": "deterministic signals only, 0 fragmentation"
})

# Before iteration - check what NOT to do:
past_issues = search_logs("fragmentation", "rejection")
for issue in past_issues:
    print(f"AVOID: {issue['value'].get('reason')}")

# Hourly cron backup:
github_backup()  # Defaults to michaelparkerla2/SN61-
"""

import requests
from typing import Any, Optional
from datetime import datetime

# ============================================
# CONFIGURATION - UPDATE THIS WITH YOUR URL
# ============================================
SNAPPY_URL = "https://your-snappy-app.vercel.app"  # <-- CHANGE THIS


def store_log(key: str, value: dict[str, Any]) -> dict[str, Any]:
    """
    Store a memory log in SNappY.
    
    Args:
        key: Unique identifier (e.g., "dfp_v7", "rejection_v6_fragmentation")
        value: Memory data with fields:
            - type: "submission" | "win" | "rejection" | "plan" | "avoid"
            - version: Version string (e.g., "v7")
            - status: "pending" | "accepted" | "rejected"
            - score: (optional) Float 0-1
            - hash: (optional) Submission hash
            - signals: (optional) List of signal names
            - reason: (optional) Why it failed/what to avoid
            - fix: (optional) What fix was applied
            - notes: (optional) Additional notes
    
    Returns:
        Response dict with status, key, and id
    
    Example:
        store_log("dfp_v7", {
            "type": "submission",
            "version": "v7", 
            "status": "pending",
            "signals": ["font_enum", "raf_cadence"]
        })
    """
    try:
        response = requests.post(
            f"{SNAPPY_URL}/api/store",
            json={"key": key, "value": value},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[SNappY] Store failed: {e}")
        return {"error": str(e)}


def retrieve_log(key: str) -> Optional[dict[str, Any]]:
    """
    Retrieve a memory by key.
    
    Args:
        key: The memory key (e.g., "dfp_v7")
    
    Returns:
        Memory value dict or None if not found
    
    Example:
        memory = retrieve_log("dfp_v7")
        if memory:
            print(f"Status: {memory['status']}")
    """
    try:
        response = requests.get(
            f"{SNAPPY_URL}/api/retrieve",
            params={"key": key},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get("value")
    except requests.RequestException as e:
        print(f"[SNappY] Retrieve failed: {e}")
        return None


def search_logs(
    query: str = "",
    log_type: str = "",
    limit: int = 50
) -> list[dict[str, Any]]:
    """
    Search memories by query text or type.
    
    Args:
        query: Text to search for (e.g., "fragmentation", "font_enum")
        log_type: Filter by type ("win", "rejection", "plan", "avoid", "submission")
        limit: Max results to return
    
    Returns:
        List of matching memories with key and value
    
    Example:
        # Find all rejections mentioning fragmentation
        issues = search_logs("fragmentation", "rejection")
        
        # Get all wins
        wins = search_logs(log_type="win")
        
        # Search for specific signal
        font_logs = search_logs("font_enum")
    """
    try:
        params: dict[str, Any] = {"limit": limit}
        if query:
            params["query"] = query
        if log_type:
            params["type"] = log_type
        
        response = requests.get(
            f"{SNAPPY_URL}/api/search",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        return response.json().get("matches", [])
    except requests.RequestException as e:
        print(f"[SNappY] Search failed: {e}")
        return []


def get_history(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """
    Get recent memory timeline (newest first).
    
    Args:
        limit: Number of memories to return
        offset: Skip this many entries
    
    Returns:
        List of recent memories
    
    Example:
        recent = get_history(limit=10)
        for mem in recent:
            print(f"{mem['version']}: {mem['status']}")
    """
    try:
        response = requests.get(
            f"{SNAPPY_URL}/api/history",
            params={"limit": limit, "offset": offset},
            timeout=10
        )
        response.raise_for_status()
        return response.json().get("history", [])
    except requests.RequestException as e:
        print(f"[SNappY] History failed: {e}")
        return []


def github_backup(
    owner: str = "michaelparkerla2",
    repo: str = "SN61-",
    file_path: str = "memory/snappy-logs.json",
    message: str = None
) -> dict[str, Any]:
    """
    Backup all SNappY memories to a GitHub repo.
    
    Requires GITHUB_PAT env var on the SNappY deployment.
    Defaults to michaelparkerla2/SN61- repo.
    
    Args:
        owner: GitHub username or org (default: michaelparkerla2)
        repo: Repository name (default: SN61-)
        file_path: Path in repo for the backup file
        message: Commit message (auto-generated if not provided)
    
    Returns:
        Response with commit SHA and file URL
    
    Example:
        # Hourly cron backup (uses default repo)
        result = github_backup()
        print(f"Backed up: {result.get('url')}")
    """
    try:
        payload = {
            "owner": owner,
            "repo": repo,
            "filePath": file_path,
        }
        if message:
            payload["message"] = message
        else:
            payload["message"] = f"SNappY backup {datetime.now().isoformat()}"
        
        response = requests.post(
            f"{SNAPPY_URL}/api/github-push",
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[SNappY] GitHub backup failed: {e}")
        return {"error": str(e)}


def export_all() -> dict[str, Any]:
    """
    Export all memories as a single JSON object.
    
    Returns:
        Dict with exportedAt timestamp and all memory data
    
    Example:
        data = export_all()
        with open("backup.json", "w") as f:
            json.dump(data, f, indent=2)
    """
    try:
        response = requests.get(
            f"{SNAPPY_URL}/api/bulk",
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[SNappY] Export failed: {e}")
        return {"error": str(e)}


# ============================================
# CLAW BOT INTEGRATION HELPERS
# ============================================

def log_submission(
    version: str,
    hash_value: str,
    signals: list[str],
    notes: str = ""
) -> dict[str, Any]:
    """
    Convenience method to log a new submission.
    Call this after Claw submits to SN61.
    """
    return store_log(f"submission_{version}_{datetime.now().strftime('%Y%m%d_%H%M%S')}", {
        "type": "submission",
        "version": version,
        "status": "pending",
        "hash": hash_value,
        "signals": signals,
        "notes": notes
    })


def log_win(
    version: str,
    score: float,
    signals: list[str],
    notes: str = ""
) -> dict[str, Any]:
    """
    Log a winning submission.
    Call this when Claw's submission is accepted with positive score.
    """
    return store_log(f"win_{version}_{datetime.now().strftime('%Y%m%d_%H%M%S')}", {
        "type": "win",
        "version": version,
        "status": "accepted",
        "score": score,
        "signals": signals,
        "notes": notes
    })


def log_rejection(
    version: str,
    score: float,
    reason: str,
    fix: str = ""
) -> dict[str, Any]:
    """
    Log a rejected submission with reason.
    Call this when Claw's submission fails.
    IMPORTANT: Include reason so Claw never repeats the mistake.
    """
    return store_log(f"rejection_{version}_{datetime.now().strftime('%Y%m%d_%H%M%S')}", {
        "type": "rejection",
        "version": version,
        "status": "rejected",
        "score": score,
        "reason": reason,
        "fix": fix
    })


def log_avoid(rule: str, context: str = "") -> dict[str, Any]:
    """
    Log something Claw should NEVER do again.
    These are permanent rules learned from failures.
    """
    return store_log(f"avoid_{datetime.now().strftime('%Y%m%d_%H%M%S')}", {
        "type": "avoid",
        "version": "permanent",
        "status": "rejected",
        "reason": rule,
        "notes": context
    })


def log_plan(version: str, plan: str, signals: list[str] = None) -> dict[str, Any]:
    """
    Log a plan for next iteration.
    Call before starting a new version.
    """
    return store_log(f"plan_{version}_{datetime.now().strftime('%Y%m%d_%H%M%S')}", {
        "type": "plan",
        "version": version,
        "status": "pending",
        "signals": signals or [],
        "notes": plan
    })


def get_things_to_avoid() -> list[str]:
    """
    Get all logged rules of things to avoid.
    Call this before every iteration to check constraints.
    """
    avoid_logs = search_logs(log_type="avoid")
    return [log["value"].get("reason", "") for log in avoid_logs if log.get("value")]


def get_past_rejections(query: str = "") -> list[dict]:
    """
    Get past rejections, optionally filtered by query.
    Use to learn from mistakes.
    """
    return search_logs(query=query, log_type="rejection")


def get_winning_patterns() -> list[dict]:
    """
    Get all winning submissions.
    Use to identify what works.
    """
    return search_logs(log_type="win")


def sync_redfeed() -> dict[str, Any]:
    """
    Sync RedFeed data into SNappY memories.
    
    Pulls data from https://theredfeed.vercel.app/api/redteam-data
    and extracts:
    - High penalty entries (things to avoid)
    - Volatile signal mentions (add to avoid list)
    - High score patterns (what works)
    - Fragmentation/collision insights
    
    Call this periodically (e.g., every hour) to keep
    Claw updated with latest RedTeam intel.
    
    Returns:
        Dict with sync status, rows processed, learnings extracted
    
    Example:
        result = sync_redfeed()
        print(f"Synced {result['rowsProcessed']} rows")
        print(f"Added {result['avoidsAdded']} new avoid rules")
    """
    try:
        response = requests.post(
            f"{SNAPPY_URL}/api/sync-redfeed",
            timeout=60  # May take longer for large syncs
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[SNappY] RedFeed sync failed: {e}")
        return {"error": str(e)}


def get_redfeed_status() -> dict[str, Any]:
    """
    Check when RedFeed was last synced.
    
    Returns:
        Dict with lastSync timestamp
    """
    try:
        response = requests.get(
            f"{SNAPPY_URL}/api/sync-redfeed",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[SNappY] RedFeed status check failed: {e}")
        return {"error": str(e)}


# ============================================
# EXAMPLE: INTEGRATION WITH CLAW PIPELINE
# ============================================
"""
# In your pipeline.py:

from snappy_client import (
    log_submission, log_win, log_rejection, log_avoid,
    get_things_to_avoid, get_past_rejections, get_winning_patterns,
    github_backup, sync_redfeed
)

def pre_iteration_check():
    '''Run before each iteration to load constraints'''
    
    # Load things to never do
    avoid_rules = get_things_to_avoid()
    print(f"[Claw] Loaded {len(avoid_rules)} avoid rules")
    for rule in avoid_rules:
        print(f"  - AVOID: {rule}")
    
    # Load past rejections for context
    rejections = get_past_rejections("fragmentation")
    if rejections:
        print(f"[Claw] {len(rejections)} past fragmentation issues found")
    
    # Load winning patterns
    wins = get_winning_patterns()
    print(f"[Claw] {len(wins)} winning patterns to follow")
    
    return {
        "avoid": avoid_rules,
        "rejections": rejections,
        "wins": wins
    }


def post_submit(version, hash_value, signals):
    '''Run after submitting to SN61'''
    log_submission(version, hash_value, signals, "Submitted to RedTeam")


def on_result(version, score, signals):
    '''Run when result comes back'''
    if score >= 0.5:
        log_win(version, score, signals, "Positive score!")
    else:
        # Analyze why it failed
        reason = analyze_failure(score, signals)  # Your analysis function
        fix = suggest_fix(reason)  # Your fix suggestion
        log_rejection(version, score, reason, fix)
        
        # If it's a critical rule, add to permanent avoid list
        if "volatile" in reason.lower() or "fragmentation" in reason.lower():
            log_avoid(f"Do not use volatile signals that cause {reason}")


def hourly_cron():
    '''Run hourly to sync RedFeed and backup to GitHub'''
    # Sync latest RedTeam intel
    sync_result = sync_redfeed()
    print(f"[Claw] RedFeed sync: {sync_result.get('rowsProcessed', 0)} rows, {sync_result.get('avoidsAdded', 0)} new avoids")
    
    # Backup to GitHub
    github_backup()  # Defaults to michaelparkerla2/SN61-
"""


if __name__ == "__main__":
    # Quick test
    print("SNappY Client - Testing connection...")
    print(f"URL: {SNAPPY_URL}")
    
    # Test store
    result = store_log("test_key", {
        "type": "submission",
        "version": "test",
        "status": "pending",
        "notes": "Test from Python client"
    })
    print(f"Store result: {result}")
    
    # Test retrieve
    value = retrieve_log("test_key")
    print(f"Retrieved: {value}")
    
    # Test history
    history = get_history(limit=5)
    print(f"History count: {len(history)}")
    
    print("Done!")
