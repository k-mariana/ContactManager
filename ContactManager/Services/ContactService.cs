using AutoMapper;
using ContactManager.Mapping;
using ContactManager.Models.Domain;
using ContactManager.Models.DTO;
using ContactManager.Repositories.Interfaces;
using ContactManager.Services.Interfaces;
using CsvHelper;
using CsvHelper.Configuration;
using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace ContactManager.Services
{
    public class ContactService : IContactService
    {
        private readonly IContactRepository _repo;
        private readonly IMapper _mapper;

        public ContactService(IContactRepository repo, IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ContactDto>> GetAllAsync()
        {
            var result = await _repo.GetAllAsync();
            return _mapper.Map<IEnumerable<ContactDto>>(result);
        }

        public async Task<int> ImportFromCsvAsync(IFormFile file)
        {
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                TrimOptions = TrimOptions.Trim,
                DetectDelimiter = true,
                MissingFieldFound = null,
                BadDataFound = null
            };

            using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, config);
            csv.Context.RegisterClassMap<ContactCsvMap>();

            var records = csv.GetRecords<ContactCsvDto>();
            int count = 0;

            foreach (var record in records)
            {
                var validationContext = new ValidationContext(record);
                var validationResults = new List<ValidationResult>();
                if (!Validator.TryValidateObject(record, validationContext, validationResults, validateAllProperties: true))
                {
                    var rowErr = string.Join("; ", validationResults.Select(v => v.ErrorMessage));
                    continue;
                }
                if (string.IsNullOrWhiteSpace(record.Name)) continue;
                if (string.IsNullOrWhiteSpace(record.Phone)) continue;
                if (record.Salary < 0) continue;

                var contact = new Contact
                {
                    Name = record.Name,
                    DateOfBirth = record.DateOfBirth,
                    Married = record.Married, 
                    Phone = record.Phone,
                    Salary = record.Salary
                };

                await _repo.AddAsync(contact);
                count++;
            }

            await _repo.SaveChangesAsync();
            return count;
        }

        public async Task<ContactDto> UpdateAsync(ContactDto dto)
        {
            var entity = await _repo.GetByIdAsync(dto.Id);
            if (entity == null) throw new KeyNotFoundException("Contact not found");

            _mapper.Map(dto, entity);
            _repo.Update(entity);
            await _repo.SaveChangesAsync();

            return _mapper.Map<ContactDto>(entity);
        }
     
        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null) return false;

            _repo.Delete(entity);
            await _repo.SaveChangesAsync();
            return true;
        }
      
    }
}
