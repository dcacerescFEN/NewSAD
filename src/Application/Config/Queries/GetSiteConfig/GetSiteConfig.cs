namespace Application.Config.Queries.GetSiteConfig;

public record GetSiteConfig : IRequest<ApiResponse<SiteConfigDto>>;

public class GetSiteConfigHandler(IApiResponseService responseService) : IRequestHandler<GetSiteConfig, ApiResponse<SiteConfigDto>>
{
    private readonly IApiResponseService _responseService = responseService;

    public Task<ApiResponse<SiteConfigDto>> Handle(GetSiteConfig request, CancellationToken cancellationToken)
    {
        var config = new SiteConfigDto
        {
            StudentsMenuUrl = ConfigSite.StudentsMenuUrl,
            TeachersMenuUrl = ConfigSite.TeachersMenuUrl,
            CoursesMenuUrl = ConfigSite.CoursesMenuUrl,
            ExamsMenuUrl = ConfigSite.ExamsMenuUrl,
            ActivitiesMenuUrl = ConfigSite.ActivitiesMenuUrl,
            AssistantsMenuUrl = ConfigSite.AssistantsMenuUrl,
            ProcessesMenuUrl = ConfigSite.ProcessesMenuUrl,
            AdministrationMenuUrl = ConfigSite.AdministrationMenuUrl,
        };

        return Task.FromResult(_responseService.Success(config));
    }
}
