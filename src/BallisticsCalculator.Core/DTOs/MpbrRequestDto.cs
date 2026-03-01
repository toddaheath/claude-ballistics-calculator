using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class MpbrRequestDto
{
    [Range(1, int.MaxValue, ErrorMessage = "CartridgeId must be a positive integer.")]
    public int CartridgeId { get; set; }

    [Range(1, 12, ErrorMessage = "VitalZoneRadiusInches must be between 1 and 12.")]
    public double? VitalZoneRadiusInches { get; set; } // Default: 3.0 (6" zone)

    [Range(0.5, 6, ErrorMessage = "SightHeightInches must be between 0.5 and 6.")]
    public double? SightHeightInches { get; set; }

    [RegularExpression(@"^(G1|G7)$", ErrorMessage = "DragModel must be 'G1' or 'G7'.")]
    public string? DragModel { get; set; }

    [RegularExpression(@"^(yards|meters)$", ErrorMessage = "UnitSystem must be 'yards' or 'meters'.")]
    public string UnitSystem { get; set; } = "yards";
}
