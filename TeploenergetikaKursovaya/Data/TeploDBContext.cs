using Microsoft.EntityFrameworkCore;

namespace TeploenergetikaKursovaya.Data
{
    public class TeploDBContext : DbContext
    {
        public DbSet<Variant> Variants { get; set; }
        public DbSet<LRC> LRCs { get; set; }
        public DbSet<KVoA> KVoAs { get; set; }
        public DbSet<DotMC> DotMCs { get; set; }
        public DbSet<Roughness> Roughnesses { get; set; }
        public TeploDBContext(DbContextOptions<TeploDBContext> options) : base(options) { }
    }
}
