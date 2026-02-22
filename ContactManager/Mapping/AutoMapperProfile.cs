using AutoMapper;
using ContactManager.Models.Domain;
using ContactManager.Models.DTO;

namespace ContactManager.Mapping
{
    public class AutoMapperProfile: Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<Contact, ContactDto>().ReverseMap();
        }
    }
}
