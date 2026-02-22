using ContactManager.Models.Domain;
using Microsoft.EntityFrameworkCore;

namespace ContactManager.Data
{
    public class AppDbContext: DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Contact> Contacts => Set<Contact>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Contact>(e =>
            {
                e.Property(p => p.Salary).HasColumnType("decimal(18,2)");
                e.Property(p => p.Name).HasMaxLength(100).IsRequired();
                e.Property(p => p.Phone).HasMaxLength(30);
            });
        }
    }
}
