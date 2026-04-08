from django.urls import path
from .api_views import (
    MyGamificationSummaryView,
    LeaderboardView,
    ChallengeListView,
    RewardListView,
    RedeemRewardView,
    MyRedemptionsView,
)

urlpatterns = [
    path("me/gamification/", MyGamificationSummaryView.as_view(), name="api_my_gamification"),
    path("leaderboard/", LeaderboardView.as_view(), name="api_leaderboard"),
    path("challenges/", ChallengeListView.as_view(), name="api_challenges"),
    path("rewards/", RewardListView.as_view(), name="api_rewards"),
    path("rewards/<int:reward_id>/redeem/", RedeemRewardView.as_view(), name="api_rewards_redeem"),
    path("me/redemptions/", MyRedemptionsView.as_view(), name="api_my_redemptions"),
]