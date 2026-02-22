using ContactManager.Data;
using ContactManager.Models.Domain;
using ContactManager.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ContactManager.Repositories
{
    public class ContactRepository: IContactRepository
    {
        private readonly AppDbContext _context;
        public ContactRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Contact>> GetAllAsync()
        {
            var contacts = await _context.Contacts.AsNoTracking().OrderBy(c => c.Id).ToListAsync();
            return contacts;
        }

        public async Task<Contact?> GetByIdAsync(int id) => await _context.Contacts.FindAsync(id);

        public async Task AddAsync(Contact contact)
        {
            await _context.Contacts.AddAsync(contact);
        }

        public void Update(Contact contact)
        {
            _context.Contacts.Update(contact);
        }

        public void Delete(Contact contact)
        {
            _context.Contacts.Remove(contact);
        }
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
