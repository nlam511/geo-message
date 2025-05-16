from enum import Enum

class SubscriptionTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    GOLD = "gold"
