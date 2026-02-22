using ContactManager.Models.DTO;
using ContactManager.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace ContactManager.Controllers
{
    public class ContactController : Controller
    {
        private readonly IContactService _contactService;

        public ContactController(IContactService contactService)
        {
            _contactService = contactService;
        }

        public async Task<IActionResult> Index()
        {
            var contacts = await _contactService.GetAllAsync();
            return View(contacts);
        }

        // POST /Contact/Upload
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                TempData["Error"] = "Please select a non-empty CSV file.";
                return RedirectToAction(nameof(Index));
            }

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                TempData["Error"] = "Only .csv files are supported.";
                return RedirectToAction(nameof(Index));
            }

            try
            {
                int importedCount = await _contactService.ImportFromCsvAsync(file);
                TempData["Message"] = $"Imported {importedCount} row(s).";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                TempData["Error"] = $"Failed to parse CSV: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }

        // Lightweight JSON endpoints for client-side inline edit/delete

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var data = await _contactService.GetAllAsync();
            return Json(data);
        }

        [HttpPut]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Update([FromBody] ContactDto dto)
        {
            if (dto == null || dto.Id <= 0) return BadRequest("Invalid payload");

            // Basic validation
            var context = new ValidationContext(dto);
            var results = new List<ValidationResult>();
            if (!Validator.TryValidateObject(dto, context, results, validateAllProperties: true))
                return UnprocessableEntity(new { errors = results.Select(r => r.ErrorMessage) });

            var updated = await _contactService.UpdateAsync(dto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpDelete]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _contactService.DeleteAsync(id);
            if (!entity)
                return NotFound();

            return Ok();
        }
    }
}
