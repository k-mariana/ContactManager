using ContactManager.Models.DTO;
using CsvHelper.Configuration;

namespace ContactManager.Mapping
{
    public class ContactCsvMap : ClassMap<ContactCsvDto>
    {
        public ContactCsvMap()
        {
            Map(m => m.Name).Name("Name");
            Map(m => m.DateOfBirth).Name("Date of birth", "DateOfBirth").TypeConverterOption.Format(new[]
            {
            "yyyy-MM-dd", "MM/dd/yyyy", "dd.MM.yyyy", "dd/MM/yyyy"
            });
            Map(m => m.Married).Name("Married");
            Map(m => m.Phone).Name("Phone");
            Map(m => m.Salary).Name("Salary");
        }
        
    }
}
