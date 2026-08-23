import numpy as np


def calculate_angle(a, b, c):
    """
    Calculates the angle (in degrees) at joint 'b' formed by points a -> b -> c.
    
    Parameters:
        a: (x, y) coordinates of first joint (e.g. Hip)
        b: (x, y) coordinates of middle joint / vertex (e.g. Knee)
        c: (x, y) coordinates of third joint (e.g. Ankle)
        
    Returns:
        angle: Angle in degrees between 0.0 and 180.0
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    # Calculate angle using arctan2
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)

    # Normalize angle to range [0, 180]
    if angle > 180.0:
        angle = 360.0 - angle

    return round(float(angle), 1)


def calculate_distance(p1, p2):
    """
    Calculates Euclidean distance between two (x, y) points.
    """
    p1 = np.array(p1)
    p2 = np.array(p2)
    return float(np.linalg.norm(p1 - p2))
