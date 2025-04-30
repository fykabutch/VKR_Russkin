using Microsoft.EntityFrameworkCore;

namespace TeploenergetikaKursovaya.Data
{
    public class TeploDBContext : DbContext
    {
        public DbSet<Variant> Variants { get; set; }
        public TeploDBContext(DbContextOptions<TeploDBContext> options) : base(options) { }
    }
}
