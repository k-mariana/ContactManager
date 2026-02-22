using ContactManager.Models.DTO;

namespace ContactManager.Services.Interfaces
{
    public interface IContactService
    {
        Task<IEnumerable<ContactDto>> GetAllAsync();
        Task<int> ImportFromCsvAsync(IFormFile file);
        Task<ContactDto> UpdateAsync(ContactDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
