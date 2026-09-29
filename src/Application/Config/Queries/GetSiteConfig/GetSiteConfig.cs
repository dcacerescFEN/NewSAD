namespace Application.Config.Queries.GetSiteConfig;

public record GetSiteConfig : IRequest<ApiResponse<SiteConfigDto>>;

public class GetSiteConfigHandler(IApiResponseService responseService) : IRequestHandler<GetSiteConfig, ApiResponse<SiteConfigDto>>
{
    private readonly IApiResponseService _responseService = responseService;

    public Task<ApiResponse<SiteConfigDto>> Handle(GetSiteConfig request, CancellationToken cancellationToken)
    {
        var config = new SiteConfigDto
        {
            DefaultSemester = ConfigSite.DefaultSemester,
            DefaultSemesterPostgraduate = ConfigSite.DefaultSemesterPosgraduate,
            PregraduateStudentTypes = ConfigSite.PregraduateStudentTypes,
            Menu = ConfigSite.Menu,
        };

        return Task.FromResult(_responseService.Success(config));
    }
}
