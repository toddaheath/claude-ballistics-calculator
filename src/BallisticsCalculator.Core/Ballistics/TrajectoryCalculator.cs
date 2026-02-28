using BallisticsCalculator.Core.Models;

namespace BallisticsCalculator.Core.Ballistics;

public class TrajectoryCalculator
{
    private const double Dt = 0.001; // Time step in seconds
    private const int MaxZeroIterations = 50;
    private const double ZeroTolerance = 0.0001; // inches

    public TrajectoryResult Calculate(
        Cartridge cartridge,
        double zeroRangeYards = BallisticConstants.DefaultZeroRangeYards,
        double maxRangeYards = BallisticConstants.DefaultMaxRangeYards,
        double shotHeightInches = BallisticConstants.DefaultShotHeightInches,
        double sightHeightInches = BallisticConstants.DefaultSightHeightInches,
        double windSpeedMph = 0,
        double windDirectionDeg = 0,
        double temperatureF = BallisticConstants.StandardTemperatureF,
        double altitudeFt = BallisticConstants.StandardAltitudeFt,
        double pressureInHg = BallisticConstants.StandardPressureInHg,
        double humidityPercent = BallisticConstants.StandardHumidityPercent,
        double shootingAngleDeg = 0)
    {
        ArgumentNullException.ThrowIfNull(cartridge);
        if (cartridge.MuzzleVelocityFps <= 0)
            throw new ArgumentException("MuzzleVelocityFps must be positive.", nameof(cartridge));
        if (cartridge.BallisticCoefficientG1 <= 0)
            throw new ArgumentException("BallisticCoefficientG1 must be positive.", nameof(cartridge));
        if (cartridge.BulletWeightGrains <= 0)
            throw new ArgumentException("BulletWeightGrains must be positive.", nameof(cartridge));

        double zeroRangeFt = zeroRangeYards * BallisticConstants.FeetPerYard;
        double maxRangeFt = maxRangeYards * BallisticConstants.FeetPerYard;

        // Calculate air density from atmospheric conditions
        double airDensity = CalculateAirDensity(temperatureF, pressureInHg, altitudeFt, humidityPercent);

        // Effective gravity adjusted for shooting angle
        double cosAngle = Math.Cos(shootingAngleDeg * Math.PI / 180.0);
        double effectiveGravity = BallisticConstants.Gravity * cosAngle;

        // Find the bore elevation angle so the bullet crosses line of sight at zero range
        double boreAngleRad = FindZeroAngle(cartridge, zeroRangeFt, sightHeightInches,
            airDensity, effectiveGravity);
        double boreAngleMOA = boreAngleRad * BallisticConstants.MOAPerRadian;

        // Wind parameters
        double windSpeedFps = windSpeedMph * 5280.0 / 3600.0;
        double windAngleRad = windDirectionDeg * Math.PI / 180.0;
        double crosswind = windSpeedFps * Math.Sin(windAngleRad);

        // Integrate the full trajectory
        var points = IntegrateTrajectory(cartridge, boreAngleRad, maxRangeFt,
            sightHeightInches, shotHeightInches, airDensity, effectiveGravity,
            crosswind);

        // Find height at 50 yards
        double heightAt50 = GetHeightAtYardMark(points, 50.0);

        // Find the second crossing range where bullet height matches 50-yard height
        double secondCrossingRange = FindSecondCrossingRange(points, heightAt50);

        // Find transonic range (first point where Mach < 1.2)
        double transonicRange = FindTransonicRange(points);

        return new TrajectoryResult
        {
            Points = points,
            ZeroRange = zeroRangeYards,
            MuzzleVelocity = cartridge.MuzzleVelocityFps,
            MaxRange = maxRangeYards,
            CartridgeName = cartridge.Name,
            BoreElevationAngleMOA = boreAngleMOA,
            HeightAt50 = heightAt50,
            SecondCrossingRange = secondCrossingRange,
            ShotHeightInches = shotHeightInches,
            TransonicRange = transonicRange
        };
    }

    private static double CalculateAirDensity(double tempF, double pressureInHg,
        double altitudeFt, double humidityPct)
    {
        // Convert to absolute units
        double tempR = tempF + 459.67; // Rankine
        double stdTempR = BallisticConstants.StandardTemperatureF + 459.67;

        // Pressure ratio (actual vs standard)
        double pressureRatio = pressureInHg / BallisticConstants.StandardPressureInHg;

        // Temperature ratio (standard/actual — colder air is denser)
        double tempRatio = stdTempR / tempR;

        // Humidity correction (water vapor is less dense than dry air)
        double humidityCorrection = 1.0;
        if (humidityPct > 0)
        {
            // Magnus formula: saturation vapor pressure in inHg
            double tempC = (tempF - 32.0) * 5.0 / 9.0;
            double satVaporPressureMillibar = 6.1078 * Math.Exp((17.27 * tempC) / (tempC + 237.3));
            double satVaporPressureInHg = satVaporPressureMillibar * 0.02953;
            double vaporPressure = humidityPct / 100.0 * satVaporPressureInHg;
            humidityCorrection = 1.0 - 0.3783 * vaporPressure / pressureInHg;
        }

        return BallisticConstants.AirDensity * pressureRatio * tempRatio * humidityCorrection;
    }

    private double FindZeroAngle(Cartridge cartridge, double zeroRangeFt,
        double sightHeightInches, double airDensity, double gravity)
    {
        double sightHeightFt = sightHeightInches / BallisticConstants.InchesPerFoot;

        // Binary search for the angle that makes bullet cross LOS at zero range
        double lowAngle = 0.0;
        double highAngle = 0.01; // ~34 MOA, generous upper bound

        for (int i = 0; i < MaxZeroIterations; i++)
        {
            double midAngle = (lowAngle + highAngle) / 2.0;
            double heightAtZero = SimulateHeightAtRange(cartridge, midAngle, zeroRangeFt,
                sightHeightFt, airDensity, gravity);

            if (Math.Abs(heightAtZero) < ZeroTolerance / BallisticConstants.InchesPerFoot)
                return midAngle;

            if (heightAtZero < 0)
                lowAngle = midAngle;
            else
                highAngle = midAngle;
        }

        return (lowAngle + highAngle) / 2.0;
    }

    private double SimulateHeightAtRange(Cartridge cartridge, double angleRad,
        double rangeFt, double sightHeightFt, double airDensity, double gravity)
    {
        double vx = cartridge.MuzzleVelocityFps * Math.Cos(angleRad);
        double vy = cartridge.MuzzleVelocityFps * Math.Sin(angleRad);
        double x = 0;
        double y = -sightHeightFt; // Bore starts below sight line

        double bc = cartridge.BallisticCoefficientG1;

        while (x < rangeFt)
        {
            (x, y, vx, vy) = RK4Step(x, y, vx, vy, bc, airDensity, gravity);
        }

        return y; // Height relative to line of sight in feet
    }

    private List<TrajectoryPoint> IntegrateTrajectory(Cartridge cartridge, double angleRad,
        double maxRangeFt, double sightHeightInches, double shotHeightInches,
        double airDensity, double gravity, double crosswind)
    {
        double sightHeightFt = sightHeightInches / BallisticConstants.InchesPerFoot;
        double vx = cartridge.MuzzleVelocityFps * Math.Cos(angleRad);
        double vy = cartridge.MuzzleVelocityFps * Math.Sin(angleRad);
        double x = 0;
        double y = -sightHeightFt; // Bore starts below sight line

        double bc = cartridge.BallisticCoefficientG1;

        var points = new List<TrajectoryPoint>();
        double time = 0;
        double nextYardMark = 0;
        double yardInFt = BallisticConstants.FeetPerYard;

        // Record a point at each yard
        while (x <= maxRangeFt)
        {
            double velocity = Math.Sqrt(vx * vx + vy * vy);

            if (x >= nextYardMark * yardInFt)
            {
                double rangeYards = nextYardMark;
                double heightInches = y * BallisticConstants.InchesPerFoot;
                double dropInches = ComputePureDrop(time);
                double energy = velocity * velocity * cartridge.BulletWeightGrains /
                               BallisticConstants.EnergyConstant;
                double mach = velocity / BallisticConstants.SpeedOfSound;

                // Wind drift: drift = crosswind * lag_time * 12 (convert ft to inches)
                // lag_time = actual_time - vacuum_time
                double vacuumTime = rangeYards * BallisticConstants.FeetPerYard /
                                   cartridge.MuzzleVelocityFps;
                double lagTime = time - vacuumTime;
                double windDriftInches = crosswind * lagTime * BallisticConstants.InchesPerFoot;

                // MOA and mil conversions
                double dropMoa = rangeYards > 0
                    ? (heightInches / rangeYards) * (100.0 / BallisticConstants.InchesPerMOA_At100Yd)
                    : 0;
                double dropMils = rangeYards > 0
                    ? (heightInches / rangeYards) * (100.0 / 3.6)
                    : 0;
                double windDriftMoa = rangeYards > 0
                    ? (windDriftInches / rangeYards) * (100.0 / BallisticConstants.InchesPerMOA_At100Yd)
                    : 0;
                double windDriftMils = rangeYards > 0
                    ? (windDriftInches / rangeYards) * (100.0 / 3.6)
                    : 0;

                // Transonic detection
                bool isTransonic = mach < BallisticConstants.TransonicMach;

                points.Add(new TrajectoryPoint
                {
                    Range = rangeYards,
                    Height = heightInches,
                    Velocity = velocity,
                    Energy = energy,
                    TimeOfFlight = time,
                    Mach = mach,
                    Drop = dropInches,
                    WindDriftInches = windDriftInches,
                    DropMoa = dropMoa,
                    DropMils = dropMils,
                    WindDriftMoa = windDriftMoa,
                    WindDriftMils = windDriftMils,
                    IsTransonic = isTransonic
                });

                nextYardMark += 1;
            }

            (x, y, vx, vy) = RK4Step(x, y, vx, vy, bc, airDensity, gravity);
            time += Dt;
        }

        return points;
    }

    private (double x, double y, double vx, double vy) RK4Step(
        double x, double y, double vx, double vy, double bc,
        double airDensity, double gravity)
    {
        var (k1vx, k1vy) = ComputeAcceleration(vx, vy, bc, airDensity, gravity);
        double k1x = vx;
        double k1y = vy;

        var (k2vx, k2vy) = ComputeAcceleration(vx + k1vx * Dt / 2, vy + k1vy * Dt / 2, bc, airDensity, gravity);
        double k2x = vx + k1vx * Dt / 2;
        double k2y = vy + k1vy * Dt / 2;

        var (k3vx, k3vy) = ComputeAcceleration(vx + k2vx * Dt / 2, vy + k2vy * Dt / 2, bc, airDensity, gravity);
        double k3x = vx + k2vx * Dt / 2;
        double k3y = vy + k2vy * Dt / 2;

        var (k4vx, k4vy) = ComputeAcceleration(vx + k3vx * Dt, vy + k3vy * Dt, bc, airDensity, gravity);
        double k4x = vx + k3vx * Dt;
        double k4y = vy + k3vy * Dt;

        return (
            x + Dt * (k1x + 2 * k2x + 2 * k3x + k4x) / 6,
            y + Dt * (k1y + 2 * k2y + 2 * k3y + k4y) / 6,
            vx + Dt * (k1vx + 2 * k2vx + 2 * k3vx + k4vx) / 6,
            vy + Dt * (k1vy + 2 * k2vy + 2 * k3vy + k4vy) / 6
        );
    }

    private static (double ax, double ay) ComputeAcceleration(double vx, double vy,
        double ballisticCoefficient, double airDensity, double gravity)
    {
        double velocity = Math.Sqrt(vx * vx + vy * vy);
        if (velocity < 1.0) return (0, -gravity);

        double mach = velocity / BallisticConstants.SpeedOfSound;
        double cd = G1DragModel.GetDragCoefficient(mach);

        // BC is given in lb/in². Convert to slugs/ft² for fps unit system:
        // 1 lb = 1/g slugs, 1 in² = 1/144 ft² => BC_fps = BC * 144 / g
        double bcFps = ballisticCoefficient * 144.0 / BallisticConstants.Gravity;

        // Drag retardation factor: F_drag/m = rho * v² * Cd / (2 * BC_fps)
        // Decomposed into components: ax = -(retard/v) * vx, ay = -(retard/v) * vy - g
        double dragDecel = airDensity * velocity * cd /
                          (2.0 * bcFps);

        // Drag acts opposite to velocity direction
        double ax = -dragDecel * vx;
        double ay = -dragDecel * vy - gravity;

        return (ax, ay);
    }

    private static double ComputePureDrop(double timeOfFlight)
    {
        // Pure gravitational drop in inches (no drag, no angle)
        double dropFt = 0.5 * BallisticConstants.Gravity * timeOfFlight * timeOfFlight;
        return -dropFt * BallisticConstants.InchesPerFoot;
    }

    private static double FindTransonicRange(List<TrajectoryPoint> points)
    {
        for (int i = 1; i < points.Count; i++)
        {
            if (points[i].IsTransonic && !points[i - 1].IsTransonic)
            {
                // Linear interpolation for the exact crossing
                double machPrev = points[i - 1].Mach;
                double machCurr = points[i].Mach;
                double fraction = (BallisticConstants.TransonicMach - machPrev) /
                                 (machCurr - machPrev);
                return points[i - 1].Range + fraction * (points[i].Range - points[i - 1].Range);
            }
        }

        // Check if the bullet starts already transonic (e.g., subsonic handgun)
        if (points.Count > 0 && points[0].IsTransonic)
            return 0;

        return 0; // Never goes transonic within max range
    }

    // Points are recorded at 1-yard intervals starting at 0, so index == yard mark
    private static double GetHeightAtYardMark(List<TrajectoryPoint> points, double rangeYards)
    {
        if (points.Count == 0) return 0;

        int idx = (int)rangeYards;
        if (idx < 0) return points[0].Height;
        if (idx >= points.Count) return points[^1].Height;

        return points[idx].Height;
    }

    private static double FindSecondCrossingRange(List<TrajectoryPoint> points, double heightAt50)
    {
        // Find where the trajectory crosses the height-at-50 line after the zero range
        // The bullet goes up, crosses LOS at zero, continues up briefly, then comes down
        // We want where it matches the 50-yard height again on the way down (past zero)
        bool passedZero = false;
        bool aboveTarget = false;

        for (int i = 1; i < points.Count; i++)
        {
            // Detect when we've passed the zero (height crosses from positive to negative or near zero)
            if (points[i].Height < 0 && points[i - 1].Height >= 0)
                passedZero = true;

            if (!passedZero && points[i].Range > 50)
            {
                // Check if we're above the heightAt50 line
                if (points[i].Height > heightAt50)
                    aboveTarget = true;

                // Look for the downward crossing of the heightAt50 line
                if (aboveTarget && points[i].Height <= heightAt50 && points[i - 1].Height > heightAt50)
                {
                    // Linear interpolation for exact crossing
                    double fraction = (heightAt50 - points[i - 1].Height) /
                                     (points[i].Height - points[i - 1].Height);
                    return points[i - 1].Range + fraction * (points[i].Range - points[i - 1].Range);
                }
            }
        }

        // If trajectory is always falling (e.g., handgun), find crossing after 50 yards
        for (int i = 1; i < points.Count; i++)
        {
            if (points[i].Range <= 50) continue;

            if (points[i].Height <= heightAt50 && points[i - 1].Height > heightAt50)
            {
                double fraction = (heightAt50 - points[i - 1].Height) /
                                 (points[i].Height - points[i - 1].Height);
                return points[i - 1].Range + fraction * (points[i].Range - points[i - 1].Range);
            }
        }

        return 0; // Not found within max range
    }
}
