package com.guardpulse.backend.seed;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.guardpulse.backend.catalog.Category;
import com.guardpulse.backend.catalog.CategoryRepository;
import com.guardpulse.backend.catalog.Product;
import com.guardpulse.backend.catalog.ProductRepository;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * On startup:
 *  1. If the products table is empty, seeds the catalog (first boot of a new database).
 *  2. Always makes sure each camera's customer-facing wording (tagline, description and the
 *     "what it can do" lines) matches the text below. That is how an already-live database gets
 *     the new wording; price, stock, photos and active flag are never touched here — the admin
 *     back-office stays in charge of those.
 *
 * To change a camera's wording later, edit it here and restart the backend.
 *
 * Spec lines are written as "Label: detail" — the storefront shows the label in bold.
 * Each line must stay under 255 characters and each tagline under 255 (database limits).
 * Ranges (night-vision distance, pan/tilt, field of view, temperature) come from the
 * manufacturers' own product pages and datasheets; they are manufacturer figures, not lab tests.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public DataSeeder(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    // weightKg is the estimated BOXED weight (device + packaging + accessories) used for shipping.
    record Seed(String slug, String name, String brand, String category, boolean bundle, String sku,
                String costPrice, String price, String tagline, String description, String[] specs,
                String weightKg) {}

    static List<Seed> catalog() {
        return List.of(

            new Seed("xiaomi-c100", "Xiaomi Smart Camera C100", "xiaomi", "indoor", false, "BHR07VOGL",
                "640.55", "1199.00",
                "Watches a room in sharp 2K, day or night, and alerts you to people, loud noises and crying babies.",
                "The C100 sits on a shelf, or mounts on a wall or ceiling, and streams a crisp 2K picture to your phone. "
                + "It tells you when it spots a person, hears a baby cry or picks up a loud noise, and you can talk to "
                + "whoever is in the room through its speaker. A built-in lens cover hides the camera when you are home.",
                new String[]{
                    "Picture: Sharp 2K video (2304 x 1296) with a wide 128° view, so most of a room fits in frame",
                    "Night vision: Invisible infrared lights give a clear black-and-white picture in the dark, up to 5 m away",
                    "Low-light colour: Keeps the picture in full colour in dim light, so you can tell colours after sunset",
                    "Smart alerts: Notifies you when it sees a person, hears a baby cry or a loud noise; draw a virtual fence to be told when someone enters an area",
                    "Two-way talk: Speak to, and hear, whoever is in the room through your phone",
                    "Privacy: A physical lens cover hides the camera on demand, and you can mask parts of the picture so they are never recorded",
                    "Storage: Records to a microSD card up to 256 GB (sold separately), or to the cloud on a paid plan",
                    "Connects via: 2.4 GHz Wi-Fi, with Bluetooth for quick set-up",
                    "Works with: Xiaomi Home app, Amazon Alexa and Google Assistant",
                    "Where to use: Indoors (-10 °C to 45 °C). Stand it on a shelf, or mount it on a wall or ceiling and angle it by hand"
                }, "0.35"),

            new Seed("xiaomi-c302", "Xiaomi Smart C302 2K Indoor", "xiaomi", "indoor", false, "BHR8683GL",
                "769.35", "1399.00",
                "Turns 360° to follow people and pets around the room, and tells you when your baby cries.",
                "The C302 pans a full 360° and tilts up and down, so one camera can cover a whole room. It recognises "
                + "people and pets and follows them as they move, and alerts you to a crying baby, unusual sounds such as "
                + "breaking glass, or anyone stepping into an area you have marked out. Its lens tucks away behind a "
                + "physical shield for real privacy at home.",
                new String[]{
                    "Picture: Sharp 2K video (2304 x 1296), in full colour for longer as the light fades",
                    "Coverage: Turns a full 360° left to right and tilts about 107° up and down, controlled from your phone",
                    "Night vision: Six invisible infrared lights give a clear black-and-white picture in the dark",
                    "Smart alerts: Detects people, pets and a crying baby, and tracks people as they move through the room",
                    "Zones & sounds: Draw a virtual fence or custom zones to be alerted when someone enters, plus alerts for abnormal sounds like breaking glass",
                    "Two-way talk: Speak and listen through your phone; the microphone picks up voices from about 5 m away",
                    "Privacy: The lens retracts behind a physical shield, on demand or on a schedule",
                    "Storage: microSD card from 8 GB to 256 GB (sold separately), or cloud storage",
                    "Connects via: Wi-Fi 6, with Bluetooth for quick set-up",
                    "Works with: Xiaomi Home app, Amazon Alexa and Google Assistant",
                    "Where to use: Indoors. Stand it on a shelf, or mount it on a wall or ceiling"
                }, "0.35"),

            new Seed("xiaomi-c301-sd-bundle", "Xiaomi Smart C301 + 64GB SD Card", "xiaomi", "indoor", true,
                "BHR8683GL / HS-TF-C1-64G", "1023.00", "1599.00",
                "A 360° indoor camera with a 64 GB memory card included, ready to record straight out of the box.",
                "The C301 turns to cover a whole room and sends a sharp 2K picture to your phone. It spots people, "
                + "follows them with its lens and alerts you, and lets you talk through its speaker. This bundle includes "
                + "a 64 GB HIKSEMI C1 microSD card, so you can start recording as soon as you plug it in.",
                new String[]{
                    "In the bundle: Xiaomi Smart C301 camera plus a 64 GB HIKSEMI C1 microSD card with adapter",
                    "Picture: Sharp 2K video (2304 x 1296) through a wide-aperture lens",
                    "Coverage: Pans a full 360° and tilts 107° up and down from your phone",
                    "Night vision: Six invisible infrared lights for a clear picture in the dark, plus colour night vision in low light",
                    "Smart alerts: Detects people, follows them automatically and sends an alert to your phone",
                    "Two-way talk: Speak and listen through your phone using the built-in speaker and microphone",
                    "Privacy: A physical shield covers the lens when you do not want to be watched",
                    "Storage: Records to the included 64 GB card (cards up to 256 GB are supported), or to the cloud",
                    "Connects via: 2.4 GHz Wi-Fi",
                    "Works with: Xiaomi Home app, Amazon Alexa and Google Assistant",
                    "Where to use: Indoors (-10 °C to 45 °C). Stand it on a shelf, or mount it on a wall or ceiling, even upside down"
                }, "0.40"),

            new Seed("xiaomi-c300-dual-x2", "2x Xiaomi Smart C300 Dual Bundle", "xiaomi", "indoor", true,
                "BHR9166EU", "1359.30", "3299.00",
                "Two dual-lens cameras in one box. Each watches two directions at once, so there are no blind spots.",
                "Each C300 Dual has two lenses: a fixed wide-angle lens that always shows the whole room, and a motorised "
                + "zoom lens that turns 360° to follow movement and show detail. This bundle gives you two of these cameras, "
                + "enough for two rooms or both ends of a large space. Both lenses detect people and sounds.",
                new String[]{
                    "In the bundle: Two Xiaomi Smart C300 Dual cameras",
                    "Picture: Two sharp 2K (2304 x 1296) lenses per camera, each with a bright f/1.6 aperture",
                    "Wide lens: A fixed lens with a 112.7° view keeps the whole room in sight at all times",
                    "Zoom lens: A 6 mm lens (59.8° view) turns a full 360° to follow movement and show close-up detail",
                    "Night vision: Infrared night vision, plus full-colour pictures in low light",
                    "Smart alerts: Both lenses detect people and sounds; set a virtual fence, and the two lenses can follow a person together",
                    "Two-way talk: Speak and listen through your phone using the built-in speaker and microphone",
                    "Storage: microSD card from 16 GB to 256 GB per camera (sold separately), NAS, or cloud",
                    "Connects via: Dual-band Wi-Fi 6 (2.4 and 5 GHz) and Bluetooth 5.3",
                    "Works with: Xiaomi Home app, Amazon Alexa and Google Assistant",
                    "Where to use: Indoors (-10 °C to 40 °C). Mount on a wall or ceiling, upright or upside down"
                }, "0.80"),

            new Seed("xiaomi-c500-dual", "Xiaomi Smart Camera C500 Dual", "xiaomi", "indoor", false, "BHR8755EU",
                "1867.60", "2599.00",
                "Two sharp 2.5K lenses, one wide and one that turns and zooms, with alerts for people, pets and crying babies.",
                "The C500 Dual pairs a fixed wide-angle lens (110° view) with a motorised lens (58° view) that turns 360° "
                + "to follow movement and zoom in on detail. Both lenses show colour at night, and either one can alert you "
                + "when it spots a person, a pet or a crying baby.",
                new String[]{
                    "Picture: Two 4 MP lenses give a sharp 2.5K picture (2560 x 1440) with a bright f/1.6 aperture",
                    "Wide lens: A fixed lens with a 110° view keeps watch over the whole room",
                    "Zoom lens: A motorised lens with a 58° view turns a full 360° to follow movement and show close-up detail",
                    "Night vision: Infrared night vision plus full-colour pictures in low light, on both lenses",
                    "Smart alerts: Spots people, pets and a crying baby on both lenses; set a virtual fence to be alerted when someone crosses it",
                    "Two-way talk: Speak and listen through your phone using the built-in speaker and microphone",
                    "Privacy: Each lens has its own sleep mode, so one can be switched off while the other keeps watching; a built-in security chip encrypts your data",
                    "Storage: microSD card from 16 GB to 256 GB (sold separately), NAS, or cloud",
                    "Connects via: Dual-band Wi-Fi 6 (2.4 and 5 GHz) and Bluetooth 5.3",
                    "Works with: Xiaomi Home app, Amazon Alexa and Google Assistant",
                    "Where to use: Indoors (-10 °C to 40 °C). Place it on a shelf, or mount it upright or upside down on a ceiling"
                }, "0.50"),

            new Seed("xiaomi-c500-x2-bundle", "2x Xiaomi Smart Camera C500 Bundle", "xiaomi", "indoor", true,
                "C500-BUNDLE", "1928.00", "4799.00",
                "Two ultra-sharp 3.5K cameras that turn 360° and follow people and pets, for larger homes.",
                "Each Xiaomi Smart Camera C500 records ultra-sharp 6 MP (3.5K) video and turns a full 360° with a wide "
                + "vertical tilt, so one camera can cover a large room. It recognises and follows people and pets and shows "
                + "colour at night. This bundle includes two cameras, enough for two rooms or opposite ends of an open-plan space.",
                new String[]{
                    "In the bundle: Two Xiaomi Smart Camera C500 cameras",
                    "Picture: Ultra-sharp 3.5K video (3200 x 1800, 6 MP) from a large 1/2.45-inch sensor and an f/1.6 lens",
                    "Coverage: Turns a full 360° and tilts 116° up and down, controlled from your phone",
                    "Night vision: Full-colour night vision in low light, with infrared night vision for the dark",
                    "Smart alerts: Recognises people and pets, tracks them automatically and alerts your phone",
                    "Two-way talk: Speak and listen through your phone using the built-in speaker and microphone",
                    "Privacy: Physical privacy masking and encrypted data protection",
                    "Storage: microSD card up to 256 GB (sold separately), NAS, or cloud",
                    "Connects via: Dual-band Wi-Fi 6 (2.4 and 5 GHz); powered through USB-C",
                    "Works with: Xiaomi Home app, Amazon Alexa and Google Assistant",
                    "Where to use: Indoors. Stand on a shelf, or mount on a wall or upside down on a ceiling"
                }, "1.00"),

            new Seed("xiaomi-cw100-dual", "Xiaomi Outdoor Camera CW100 Dual", "xiaomi", "outdoor", false,
                "BHR07UIEU", "1105.15", "2199.00",
                "An outdoor camera with two lenses that together cover almost 180°, built for -30 °C to 60 °C.",
                "The CW100 Dual puts two lenses in one weatherproof body, so a single camera and a single cable watch two "
                + "areas at once, such as the driveway and the garden. It alerts you to people and vehicles, flashes a light "
                + "and sounds an alarm if someone intrudes, and lets you talk to visitors through your phone.",
                new String[]{
                    "Picture: Two sharp 2K (2304 x 1296) lenses with wide dynamic range, so bright skies and dark corners both stay clear",
                    "Coverage: The two lenses together give a view of almost 180°, with the two views overlapping slightly",
                    "Night vision: Clear night vision up to 10 m; in total darkness, full-colour recording switches on when it detects movement",
                    "Smart alerts: Detects people and vehicles, tells you when someone approaches a vehicle, and lets you draw a virtual fence",
                    "Deterrent: Sounds an alarm and flashes a warning light when it detects an intruder",
                    "Two-way talk: Talk to visitors or deliveries through your phone (started from the Xiaomi Home app)",
                    "Weatherproof: IP66 dust and water resistant, and works from -30 °C to 60 °C",
                    "Privacy: Mask parts of the picture, such as a neighbour's window, so they are never recorded",
                    "Storage: microSD card from 16 GB to 256 GB (sold separately), NAS, or cloud on a paid plan",
                    "Connects via: 2.4 GHz Wi-Fi 6, or plug in a network cable (100 Mbps) for a steadier link; Bluetooth for set-up",
                    "Power: Plug-in power with a 3 m cord and built-in adapter",
                    "Where to use: Outdoors. Mounts on a wall or ceiling"
                }, "0.60"),

            new Seed("xiaomi-cw500-sd-bundle", "Xiaomi CW500 Dual + 256GB SD Bundle", "xiaomi", "outdoor", true,
                "BHR9402EU / HS-TF-C1-256G", "3231.70", "4431.70",
                "Two 2.5K lenses, one that turns to follow intruders, with a siren and lights to scare them off. 256 GB card included.",
                "The CW500 Dual combines a fixed lens that always watches one area with a motorised lens that turns to "
                + "follow movement. It detects people and vehicles, switches to colour night vision when it sees someone, and "
                + "sounds an alarm and flashes lights to scare intruders off. This bundle includes a 256 GB HIKSEMI C1 "
                + "microSD card so it can record straight away.",
                new String[]{
                    "In the bundle: Xiaomi CW500 Dual outdoor camera plus a 256 GB HIKSEMI C1 microSD card with adapter",
                    "Picture: Two 4 MP lenses give a sharp 2.5K picture (2560 x 1440) with an f/1.6 aperture",
                    "Coverage: The motorised lens turns up to 355° and tilts 95° from your phone, while the fixed lens keeps one spot in view",
                    "Night vision: Infrared lights for the dark, and white lights that switch on to give a colour picture when a person is detected",
                    "Smart alerts: Detects people and vehicles, with virtual-fence alerts",
                    "Deterrent: Sounds an alarm and flashes lights when something suspicious is detected",
                    "Two-way talk: Talk to visitors through your phone",
                    "Weatherproof: IP66 dust and water resistant, and the camera works from -30 °C to 60 °C",
                    "Storage: Includes a 256 GB card (cards from 16 GB to 256 GB are supported), plus NAS or cloud",
                    "Connects via: Dual-band Wi-Fi 6 (2.4 and 5 GHz), or plug in a network cable",
                    "Where to use: Outdoors. Mounts on a wall, pole or ceiling"
                }, "0.90"),

            new Seed("tplink-vigi-c340", "TP-Link VIGI C340 4MP Outdoor", "tplink", "outdoor", false,
                "VIGI-C340(2.8MM)", "829.00", "1299.00",
                "A wired outdoor camera that records full-colour video all night, sees 30 m in the dark and scares intruders off with light and sound.",
                "The VIGI C340 is a professional-grade wired camera for outdoor use. Its wide 102° lens covers a driveway, "
                + "yard or shopfront and records in sharp 4 MP. Built-in lights give full-colour footage at night, and smart "
                + "detection alerts you when someone enters a zone you have set, crosses a line or covers the lens. One "
                + "network cable can carry both power (PoE) and video.",
                new String[]{
                    "Picture: Sharp 4 MP video (2560 x 1440)",
                    "Coverage: A wide 2.8 mm lens with a 102° view across",
                    "Night vision: Infrared night vision up to 30 m, plus built-in white lights reaching up to 30 m for full-colour footage after dark",
                    "Smart alerts: Detects people, motion, intruders entering a zone, line crossing and anyone tampering with the camera",
                    "Deterrent: Sounds a siren and flashes a light when it sees an intruder",
                    "Two-way talk: A built-in speaker and microphone let you talk to visitors",
                    "Weatherproof: IP66 dust and water resistant, and works from -30 °C to 60 °C",
                    "Power: Runs from a single network cable (PoE) or from a 12 V DC adapter",
                    "Storage: microSD card up to 256 GB, or an ONVIF-compatible network recorder",
                    "Connects via: Wired network (Ethernet), so it does not depend on Wi-Fi; manage it with the VIGI app",
                    "Where to use: Outdoors. Mounts on a wall, ceiling or pole"
                }, "0.50"),

            new Seed("tplink-tapo-c610", "TP-Link Tapo C610 Solar Kit", "tplink", "solar", false, "TAPO C610 KIT",
                "1549.00", "2849.00",
                "A wire-free, solar-powered outdoor camera that turns 360° and follows people, with colour night vision.",
                "Mount the Tapo C610 anywhere that gets some sun: its solar panel keeps the built-in battery topped up, "
                + "so there are no cables to run or batteries to swap. It pans and tilts to cover a wide area, detects "
                + "people so you only get alerts that matter, and switches on spotlights to show colour at night.",
                new String[]{
                    "In the kit: Tapo C610 camera, Tapo A201 solar panel, bracket and cable",
                    "Picture: Sharp 2K video (3 MP, 2304 x 1296)",
                    "Coverage: Pans and tilts to cover 360° across and 130° up and down",
                    "Night vision: Infrared night vision up to 10 m, or switch on the two spotlights for full-colour video at night",
                    "Smart alerts: Person detection cuts false alarms, and 360° tracking follows a person across the yard",
                    "Deterrent: A customisable sound and light alarm",
                    "Two-way talk: Speak and listen through your phone",
                    "Power: The battery lasts up to 200 days without sun in Tapo's lab test; about 45 minutes of direct sunlight a day keeps it charged",
                    "Weatherproof: IP65 dust and water resistant, and works from -20 °C to 45 °C",
                    "Storage: microSD card up to 512 GB (sold separately), or Tapo Care cloud on a paid plan",
                    "Works with: Tapo app, Amazon Alexa and Google Home",
                    "Where to use: Outdoors. The solar panel can sit on the camera or be mounted separately on its cable of about 4 m"
                }, "1.10"),

            new Seed("tplink-tapo-c460", "TP-Link Tapo C460 Solar Kit", "tplink", "solar", false, "TAPO C460 KIT",
                "2149.00", "3199.00",
                "Crisp 4K video with up to 18x zoom, colour night vision and solar power, with no wiring needed.",
                "The Tapo C460 records ultra-sharp 4K video and lets you zoom in up to 18x on fine detail. A solar panel "
                + "keeps its 10,000 mAh battery charged, and a magnetic base lets you position it in seconds. Free AI "
                + "detection tells you whether it saw a person, a pet or a vehicle, and spotlights and a siren are on hand "
                + "to scare off intruders.",
                new String[]{
                    "In the kit: Tapo C460 camera and Tapo A201 solar panel",
                    "Picture: Ultra-sharp 4K video (8 MP, 3840 x 2160) with up to 18x digital zoom",
                    "Coverage: A fixed lens with a wide 113° view across",
                    "Night vision: Infrared night vision up to 14.9 m, or use the two spotlights for full-colour pictures after dark",
                    "Smart alerts: Free AI detection of people, pets and vehicles, with no subscription needed",
                    "Deterrent: A loud built-in siren (up to 100 dBA) and spotlights to scare intruders off",
                    "Two-way talk: Two-way audio with noise cancellation",
                    "Power: The 10,000 mAh battery lasts up to 200 days without sun in Tapo's lab test, and the solar panel keeps it topped up",
                    "Weatherproof: Camera IP66, solar panel IP65",
                    "Storage: microSD card up to 512 GB (sold separately), or Tapo Care cloud on a paid plan",
                    "Connects via: Dual-band Wi-Fi (2.4 and 5 GHz) for smooth 4K streaming",
                    "Works with: Tapo app, Amazon Alexa and Google Assistant",
                    "Where to use: Outdoors. A magnetic base makes placing and re-aiming it quick"
                }, "1.30"),

            new Seed("tplink-tapo-c660", "TP-Link Tapo C660 Solar Pan/Tilt Kit", "tplink", "solar", false,
                "TAPO-C660-KIT", "2499.00", "3588.00",
                "4K video that turns 360° and follows people, pets and vehicles automatically, entirely wire-free.",
                "The Tapo C660 combines 4K video with a motorised head that pans 360° and tilts, locking onto people, pets "
                + "and vehicles and following them so the action stays in frame. It runs off a solar-charged 10,000 mAh "
                + "battery, shows colour at night with two spotlights, and sends free AI alerts without a subscription.",
                new String[]{
                    "In the kit: Tapo C660 camera and Tapo A201 solar panel",
                    "Picture: Ultra-sharp 4K video (8 MP, 3840 x 2160) with up to 18x digital zoom",
                    "Coverage: Pans a full 360° and tilts up to 90°, through a lens with an 88° view across",
                    "Night vision: Infrared night vision up to 12 m, or use the two spotlights for full-colour pictures after dark",
                    "Smart alerts: Free AI detection of people, pets and vehicles, with 360° auto-tracking that keeps them in frame",
                    "Two-way talk: Two-way audio with noise cancellation",
                    "Power: 10,000 mAh battery plus solar panel; about 45 minutes of sunlight a day powers the pan, tilt and tracking",
                    "Weatherproof: Camera and solar panel are both IP65",
                    "Storage: microSD card up to 512 GB (sold separately), or Tapo Care cloud on a paid plan",
                    "Connects via: Dual-band Wi-Fi: 5 GHz for speed or 2.4 GHz for range",
                    "Works with: Tapo app, Amazon Alexa and Google Assistant",
                    "Where to use: Outdoors. Mount it up high for the best view of the area"
                }, "1.30"),

            new Seed("tplink-tapo-c645d", "TP-Link Tapo C645D Dual-Lens Solar Kit", "tplink", "solar", false,
                "TAPO C645D KIT", "2799.00", "3999.00",
                "Two 2K lenses in one: an ultra-wide 165° view plus a lens that turns and zooms, powered by the sun.",
                "The Tapo C645D has a fixed ultra-wide lens that always shows the big picture, and a second pan-tilt lens "
                + "that zooms in and follows movement, each recording sharp 2K video. Six spotlights give colour at night, a "
                + "siren scares off intruders, and a solar panel keeps the battery charged with no wiring.",
                new String[]{
                    "In the kit: Tapo C645D camera and Tapo A201 solar panel",
                    "Picture: Two sharp 2K (3 MP, 2304 x 1296) lenses recording at once",
                    "Wide lens: A fixed lens with a 165° diagonal view (about 138° across) shows the whole scene at once",
                    "Zoom lens: A 6 mm telephoto lens pans 360° and tilts 120° to follow movement and show close-up detail",
                    "Night vision: Infrared night vision up to 10 m, or six spotlights for full-colour pictures after dark",
                    "Smart alerts: Free AI detection of people, pets and vehicles, with the two lenses working together to track a subject",
                    "Deterrent: A siren (91.5 dB measured at 10 cm), spotlights and alarm lights; you can record your own warning message",
                    "Two-way talk: Two-way audio with noise cancellation",
                    "Power: 10,000 mAh battery lasts up to 4 months without sun; about 55 minutes of direct sunlight a day keeps it charged",
                    "Weatherproof: IP65 dust and water resistant",
                    "Storage: microSD card up to 512 GB (sold separately), or Tapo Care cloud on a paid plan",
                    "Works with: Tapo app, Amazon Alexa and Google Assistant",
                    "Where to use: Outdoors, for yards, driveways and larger properties"
                }, "1.40")
        );
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Seed> seeds = catalog();

        if (productRepository.count() == 0) {
            Category indoor = categoryRepository.save(new Category("indoor", "Indoor", 1));
            Category outdoor = categoryRepository.save(new Category("outdoor", "Outdoor", 2));
            Category solar = categoryRepository.save(new Category("solar", "Solar-powered", 3));
            Map<String, Category> categories = Map.of("indoor", indoor, "outdoor", outdoor, "solar", solar);

            for (Seed s : seeds) {
                Product product = new Product(
                    s.slug(), s.name(), s.brand(), categories.get(s.category()), s.bundle(), s.sku(),
                    s.tagline(), s.description(), new BigDecimal(s.costPrice()), new BigDecimal(s.price()), 25,
                    new BigDecimal(s.weightKg())
                );
                for (String specText : s.specs()) {
                    product.addSpec(specText);
                }
                // Real product photography served from src/main/resources/static/products/
                product.setImageUrl("/products/" + s.slug() + ".jpg");
                productRepository.save(product);
            }
            System.out.println("Seeded " + categories.size() + " categories and " + seeds.size() + " products");
            return;
        }

        // Existing database: bring the customer-facing wording up to date, only where it differs.
        int updated = 0;
        for (Seed s : seeds) {
            Optional<Product> existing = productRepository.findBySlug(s.slug());
            if (existing.isEmpty()) continue;
            Product product = existing.get();
            List<String> wanted = Arrays.asList(s.specs());
            List<String> current = product.getSpecs().stream().map(sp -> sp.getText()).toList();
            boolean same = s.tagline().equals(product.getTagline())
                    && s.description().equals(product.getDescription())
                    && wanted.equals(current);
            if (!same) {
                product.updateContent(s.tagline(), s.description(), wanted);
                productRepository.save(product);
                updated++;
            }
        }
        if (updated > 0) {
            System.out.println("Updated camera details for " + updated + " products");
        }
    }
}