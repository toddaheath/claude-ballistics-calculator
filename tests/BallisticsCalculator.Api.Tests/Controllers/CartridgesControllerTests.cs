using System.Net;
using System.Net.Http.Json;
using BallisticsCalculator.Core.DTOs;
using FluentAssertions;

namespace BallisticsCalculator.Api.Tests.Controllers;

public class CartridgesControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CartridgesControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithCartridges()
    {
        var response = await _client.GetAsync("/api/cartridges");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var cartridges = await response.Content.ReadFromJsonAsync<List<CartridgeDto>>();
        cartridges.Should().NotBeNull();
        cartridges!.Count.Should().Be(43);
    }

    [Fact]
    public async Task GetAll_ContainsExpectedCategories()
    {
        var cartridges = await _client.GetFromJsonAsync<List<CartridgeDto>>("/api/cartridges");

        var categories = cartridges!.Select(c => c.Category).Distinct().ToList();
        categories.Should().Contain("Handgun");
        categories.Should().Contain("Standard Rifle");
        categories.Should().Contain("Intermediate");
        categories.Should().Contain("Magnum");
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsCartridge()
    {
        var response = await _client.GetAsync("/api/cartridges/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var cartridge = await response.Content.ReadFromJsonAsync<CartridgeDto>();
        cartridge.Should().NotBeNull();
        cartridge!.Id.Should().Be(1);
        cartridge.Name.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetById_NonExistentId_Returns404()
    {
        var response = await _client.GetAsync("/api/cartridges/999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetById_308Win_ReturnsCorrectData()
    {
        var cartridge = await _client.GetFromJsonAsync<CartridgeDto>("/api/cartridges/29");

        cartridge.Should().NotBeNull();
        cartridge!.Name.Should().Contain(".308 Win");
        cartridge.Category.Should().Be("Standard Rifle");
        cartridge.BulletWeightGrains.Should().Be(168);
    }
}
