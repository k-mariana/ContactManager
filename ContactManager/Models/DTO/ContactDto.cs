using System.ComponentModel.DataAnnotations;

namespace ContactManager.Models.DTO
{
    public class ContactDto
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "Date of birth")]
        [DataType(DataType.Date)]
        public DateTime? DateOfBirth { get; set; }
        public bool Married { get; set; }

        [Phone]
        [StringLength(30)]
        public string Phone { get; set; } = string.Empty;

        [Range(0, 1000000000)]
        [DataType(DataType.Currency)]
        public decimal? Salary { get; set; }
    }
}
