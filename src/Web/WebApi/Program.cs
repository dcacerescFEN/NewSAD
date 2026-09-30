using Domain.Common;
using Infrastructure.Configuration;
using Application;
using Scalar.AspNetCore;
using WebApi;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddWebApiServices(builder.Configuration);

builder.Services.AddEndpoints(typeof(Program).Assembly);

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

await app.InitialiseConfigurationAsync(builder.Configuration);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/v1.json");
    app.MapScalarApiReference(options => options
        .AddPreferredSecuritySchemes("Keycloak")
        .AddAuthorizationCodeFlow("Keycloak", flow =>
        {
            flow.ClientId = builder.Configuration["Keycloak:ClientId"]!;
            flow.Pkce = Pkce.Sha256;
            flow.SelectedScopes = ["openid", "profile"];
        }));
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapEndpoints();

app.MapFallbackToFile("/index.html");

app.Run();
