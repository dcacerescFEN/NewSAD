using Application.Common.Models;

namespace Application.Common.Interfaces;

/// <summary>Provides the configured physical client of every menu destination.</summary>
public interface ISiteMenuProvider
{
    /// <summary>Gets the menu destinations configured for this site.</summary>
    SiteMenuDto GetMenu();
}
