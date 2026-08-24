import numpy as np


def clamp_score(score, min_val=10.0, max_val=99.0):
    """Clamps score between min_val and max_val and rounds to 1 decimal place."""
    return round(float(np.clip(score, min_val, max_val)), 1)


def calculate_dribbling_score(duration_sec, ball_touches, control_consistency, direction_changes, video_quality_factor=1.0):
    """
    Calculates technical Dribbling Score from measurable features:
    Formula:
      Score = (0.35 * Consistency) + (0.35 * TouchDensityScore) + (0.30 * TimeEfficiency)
    """
    # Time Efficiency: Optimal benchmark is ~10-14 seconds for a standard slalom
    time_score = max(30.0, 100.0 - (max(0, duration_sec - 10.0) * 4.5))
    
    # Touch Density: 1 touch per ~0.8-1.2 seconds is optimal close control
    expected_touches = max(4, int(duration_sec * 1.1))
    touch_ratio = min(1.3, ball_touches / float(expected_touches))
    touch_score = min(100.0, touch_ratio * 88.0)
    
    # Agility Bonus for Directional Cuts (>38 deg)
    agility_bonus = min(8.0, direction_changes * 1.5)

    composite = (0.35 * control_consistency) + (0.35 * touch_score) + (0.30 * time_score) + agility_bonus
    return clamp_score(composite)


def calculate_shooting_score(on_target_accuracy, estimated_power, goals_detected=None, shots_count=0):
    """
    Calculates technical Shooting Score from measurable features:
    Formula:
      Score = (0.50 * OnTargetAccuracy) + (0.35 * EstimatedPowerIndex) + (0.15 * ConversionRate)
    """
    if shots_count == 0:
        return 65.0

    if goals_detected is not None and shots_count > 0:
        conversion_rate = (goals_detected / float(shots_count)) * 100.0
        composite = (0.45 * on_target_accuracy) + (0.35 * estimated_power) + (0.20 * conversion_rate)
    else:
        # When physical goal structure is unavailable, weight on-target accuracy and power
        composite = (0.55 * on_target_accuracy) + (0.45 * estimated_power)

    return clamp_score(composite)


def calculate_ball_control_score(touches_count, control_consistency, rebound_control_score, duration_sec=10.0):
    """
    Calculates Ball Control & Juggling Mastery Score:
    Formula:
      Score = (0.40 * Consistency) + (0.35 * ReboundCushion) + (0.25 * TouchVolume)
    """
    expected_touches = max(10, int(duration_sec * 2.2))
    touch_volume_score = min(100.0, (touches_count / float(expected_touches)) * 92.0)

    composite = (0.40 * control_consistency) + (0.35 * rebound_control_score) + (0.25 * touch_volume_score)
    return clamp_score(composite)


def calculate_overall_football_score(dribbling_score, shooting_score, ball_control_score, position="Striker"):
    """
    Calculates player overall technical performance score weighted by position.
    """
    weights = {
        "Striker": {"dribbling": 0.30, "shooting": 0.50, "ball_control": 0.20},
        "Winger": {"dribbling": 0.45, "shooting": 0.30, "ball_control": 0.25},
        "Midfielder": {"dribbling": 0.35, "shooting": 0.25, "ball_control": 0.40},
        "Defender": {"dribbling": 0.30, "shooting": 0.15, "ball_control": 0.55},
        "Goalkeeper": {"dribbling": 0.15, "shooting": 0.15, "ball_control": 0.70},
    }
    w = weights.get(position, weights["Striker"])
    overall = (dribbling_score * w["dribbling"]) + (shooting_score * w["shooting"]) + (ball_control_score * w["ball_control"])
    return clamp_score(overall)


def calculate_national_percentile(overall_score):
    """
    Calculates estimated national grassroots percentile ranking (0 to 99.4%).
    """
    base_percentile = 50.0 + (overall_score - 70.0) * 1.65
    return clamp_score(base_percentile, min_val=35.0, max_val=99.4)
