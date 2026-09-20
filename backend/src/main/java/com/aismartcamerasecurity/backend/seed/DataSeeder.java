package com.aismartcamerasecurity.backend.seed;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.aismartcamerasecurity.backend.catalog.Category;
import com.aismartcamerasecurity.backend.catalog.CategoryRepository;
import com.aismartcamerasecurity.backend.catalog.Product;
import com.aismartcamerasecurity.backend.catalog.ProductRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Seeds the catalog on first boot (only if the products table is empty) — same
 * slugs, prices, and specs as the original supplier product sheets.
 */
@Component
public class DataSeeder implements CommandLineRunner {
 
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
 
    public DataSeeder(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }
 
    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return; // already seeded
        }
 
        Category indoor = categoryRepository.save(new Category("indoor", "Indoor", 1));
        Category outdoor = categoryRepository.save(new Category("outdoor", "Outdoor", 2));
        Category solar = categoryRepository.save(new Category("solar", "Solar-powered", 3));
        Map<String, Category> categories = Map.of("indoor", indoor, "outdoor", outdoor, "solar", solar);
 
        // weightKg is the estimated BOXED weight (device + packaging + accessories) used for
        // shipping calculation — not spec-sheet device weight. These are reasonable estimates
        // for this product class, not measured figures; update them once you've actually
        // weighed a shipped box of each.
        record Seed(String slug, String name, String brand, String category, boolean bundle, String sku,
                    String costPrice, String price, String tagline, String description, String[] specs,
                    String weightKg) {}
 
        List<Seed> seeds = List.of(
            new Seed("xiaomi-c100", "Xiaomi Smart Camera C100", "xiaomi", "indoor", false, "BHR07VOGL",
                "640.55", "1199.00", "Sharp, simple indoor watch.",
                "Monitor your home in exceptional clarity, day or night, with the Xiaomi Smart Camera C100's " +
                "2K HD resolution and advanced infrared night vision.",
                new String[]{"2K (2304x1296) resolution", "Night vision up to 10m", "MicroSD 8GB-256GB",
                    "Wi-Fi 802.11 b/g/n/ax + Bluetooth 5.2"}, "0.35"),
 
            new Seed("xiaomi-c302", "Xiaomi Smart C302 2K Indoor", "xiaomi", "indoor", false, "BHR8683GL",
                "769.35", "1399.00", "360 degree coverage with AI pet and baby-cry alerts.",
                "2K Indoor Wi-Fi Camera with AI human & pet detection, two-way audio, physical privacy shield, " +
                "and Alexa/Google integration.",
                new String[]{"2K UHD, 360 pan / 107 tilt", "AI human, pet & baby-cry detection",
                    "Two-way audio", "Physical privacy shield"}, "0.35"),
 
            new Seed("xiaomi-c301-sd-bundle", "Xiaomi Smart C301 + 64GB SD Card", "xiaomi", "indoor", true,
                "BHR8683GL / HS-TF-C1-64G", "1023.00", "1599.00", "Ready to record straight out of the box.",
                "Xiaomi Smart C301 2K Indoor Wi-Fi Security Camera bundled with a HIKSEMI C1 64GB MicroSD " +
                "card and adapter.",
                new String[]{"2K resolution, physical lens shield", "6x 940nm infrared night vision",
                    "Includes 64GB MicroSD card", "2.4GHz Wi-Fi"}, "0.40"),
 
            new Seed("xiaomi-c300-dual-x2", "2x Xiaomi Smart C300 Dual Bundle", "xiaomi", "indoor", true,
                "BHR9166EU", "1359.30", "3299.00", "Two dual-lens guardians, zero blind spots.",
                "Two Xiaomi Smart C300 Dual 2K Indoor Wi-Fi Security Cameras: dual-camera coverage, AI human " +
                "& sound detection, Wi-Fi 6, three storage options.",
                new String[]{"Dual-lens, PTZ + fixed camera", "AI human & sound detection",
                    "Wi-Fi 6 + Bluetooth 5.3", "SD, cloud or NAS storage"}, "0.80"),
 
            new Seed("xiaomi-c500-dual", "Xiaomi Smart Camera C500 Dual", "xiaomi", "indoor", false, "BHR8755EU",
                "1867.60", "2599.00", "360 degree PTZ tracking with a flagship AI chip.",
                "Dual-lens architecture combining fixed wide-angle and PTZ cameras for complete 360 degree " +
                "coverage, with pet, baby-cry and person tracking.",
                new String[]{"Dual 4MP sensors, F1.6 aperture", "Pet, baby-cry & person tracking",
                    "Wi-Fi 6 + Bluetooth 5.3", "Finance-grade MJA1 security chip"}, "0.50"),
 
            new Seed("xiaomi-c500-x2-bundle", "2x Xiaomi Smart Camera C500 Bundle", "xiaomi", "indoor", true,
                "C500-BUNDLE", "1928.00", "4799.00", "Twice the coverage for larger homes.",
                "Two Xiaomi Smart Camera C500 units. 3.5K UHD resolution, 360 pan / 116 tilt, physical " +
                "privacy masking, colour night vision.",
                new String[]{"3.5K UHD (3200x1800) resolution", "360 pan / 116 tilt",
                    "Physical privacy masking", "Full-colour night vision"}, "1.00"),
 
            new Seed("xiaomi-cw100-dual", "Xiaomi Outdoor Camera CW100 Dual", "xiaomi", "outdoor", false,
                "BHR07UIEU", "1105.15", "2199.00", "Built for South African extremes.",
                "Dual-image outdoor camera engineered for reliable performance across a wide operating " +
                "temperature range.",
                new String[]{"2304x1296 dual-image resolution", "Operates -30C to 60C",
                    "Wi-Fi 6 + Bluetooth 5.2", "Up to 256GB MicroSD"}, "0.60"),
 
            new Seed("xiaomi-cw500-sd-bundle", "Xiaomi CW500 Dual + 256GB SD Bundle", "xiaomi", "outdoor", true,
                "BHR9402EU / HS-TF-C1-256G", "3231.70", "4431.70", "Dual 2.5K sensors with light and sound deterrent.",
                "Xiaomi CW500 Dual Outdoor 2.5K Wi-Fi 6 Smart Security Camera bundled with a HIKSEMI C1 256GB " +
                "MicroSD card and adapter.",
                new String[]{"Dual 4MP sensors, 2.5K resolution", "AI human & vehicle detection",
                    "Sound & light alarm deterrent", "IP66 weatherproof"}, "0.90"),
 
            new Seed("tplink-vigi-c340", "TP-Link VIGI C340 4MP Outdoor", "tplink", "outdoor", false,
                "VIGI-C340(2.8MM)", "829.00", "1299.00", "Wired reliability, 24-hour full colour.",
                "4MP super-HD outdoor network camera with 24h full-colour imaging, human & vehicle " +
                "classification, PoE/12V DC power, and IP67 weatherproofing.",
                new String[]{"4MP super-HD, 24h full colour", "Human & vehicle classification",
                    "PoE or 12V DC power", "IP67 waterproof"}, "0.50"),
 
            new Seed("tplink-tapo-c610", "TP-Link Tapo C610 Solar Kit", "tplink", "solar", false, "TAPO C610 KIT",
                "1549.00", "2849.00", "Pan/tilt coverage, powered by sunlight.",
                "Wireless outdoor pan/tilt camera with 2K resolution, full-colour night vision, AI person " +
                "detection, and a built-in battery plus Tapo A201 solar panel.",
                new String[]{"2K, 360 pan / 130 tilt", "Built-in battery + solar panel",
                    "AI person detection", "IP65, -20C to 45C"}, "1.10"),
 
            new Seed("tplink-tapo-c460", "TP-Link Tapo C460 Solar Kit", "tplink", "solar", false, "TAPO C460 KIT",
                "2149.00", "3199.00", "4K clarity with dual spotlights.",
                "4K solar-powered AI security camera with 18x digital zoom, AI detection of people, pets " +
                "and vehicles, and a 100dBA siren.",
                new String[]{"4K 8MP resolution, 18x zoom", "AI people, pet & vehicle detection",
                    "10,000mAh battery + solar panel", "100dBA siren"}, "1.30"),
 
            new Seed("tplink-tapo-c660", "TP-Link Tapo C660 Solar Pan/Tilt Kit", "tplink", "solar", false,
                "TAPO-C660-KIT", "2499.00", "3588.00", "Full 360 degree tracking, entirely wire-free.",
                "Solar-powered pan/tilt camera with 4K 8MP resolution, 360 pan / 90 tilt mechanical coverage, " +
                "and AI tracking of people and vehicles.",
                new String[]{"4K 8MP, 360 pan / 90 tilt", "AI tracking, people & vehicles",
                    "10,000mAh battery + solar panel", "Two-way audio, IP65"}, "1.30"),
 
            new Seed("tplink-tapo-c645d", "TP-Link Tapo C645D Dual-Lens Solar Kit", "tplink", "solar", false,
                "TAPO C645D KIT", "2799.00", "3999.00", "Wide-angle and telephoto in one camera.",
                "Dual-lens wire-free outdoor camera pairing a wide-angle and telephoto lens, both at 2K " +
                "resolution, with six spotlights and a 91.5dB siren.",
                new String[]{"Dual lens: wide + telephoto, 2K each", "360 pan + 120 tilt coverage",
                    "6 spotlights + 91.5dB siren", "10,000mAh battery + solar panel"}, "1.40")
        );
 
        for (Seed s : seeds) {
            Product product = new Product(
                s.slug(), s.name(), s.brand(), categories.get(s.category()), s.bundle(), s.sku(),
                s.tagline(), s.description(), new BigDecimal(s.costPrice()), new BigDecimal(s.price()), 25,
                new BigDecimal(s.weightKg())
            );
            for (String specText : s.specs()) {
                product.addSpec(specText);
            }
            // Real product photography, extracted from the supplier spec sheets and served
            // from src/main/resources/static/products/ — one JPEG per slug.
            product.setImageUrl("/products/" + s.slug() + ".jpg");
            productRepository.save(product);
        }
 
        System.out.println("Seeded " + categories.size() + " categories and " + seeds.size() + " products");
    }
}
 