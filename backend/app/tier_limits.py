from app.enums import SubscriptionTier

DROP_LIMITS = {
    SubscriptionTier.FREE: 90,
    SubscriptionTier.PRO: 20,
    SubscriptionTier.GOLD: 50,
}

PICKUP_RADII = {
    SubscriptionTier.FREE: 50,
    SubscriptionTier.PRO: 150,
    SubscriptionTier.GOLD: 300,
}