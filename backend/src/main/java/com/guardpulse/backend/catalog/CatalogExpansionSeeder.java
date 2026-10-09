package com.guardpulse.backend.catalog;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds the full catalogue from Products-and-Bundles_2.pdf (33 products, 13 bundles) that the
 * original DataSeeder doesn't know about. Runs once per missing slug — existing products (by
 * slug) are left untouched, so re-running after an admin has edited stock/price is safe.
 *
 * costPrice is not in the source document (it only lists selling price), so it's set here to a
 * flat 65% of price as a placeholder margin. Correct these in the admin back-office once you
 * have real supplier costs — do not treat this figure as accurate for accounting.
 */
@Component
@Order(2) // after DataSeeder, which creates the indoor/outdoor/solar categories
public class CatalogExpansionSeeder implements org.springframework.boot.CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogExpansionSeeder(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    record Seed(String slug, String name, String brand, String categoryKey, String categoryLabel,
                boolean bundle, String sku, String price, int stockQty, String tagline, String description,
                String[] specs, String weightKg) {}

    static List<Seed> catalog() {
        return List.of(

            // ---- Alarms ----
            new Seed("hikvision-door-window-contact", "Hikvision DS-PD1-MC-WWS Wireless Door/Window Contact",
                "hikvision", "alarms", "Alarms", false, "DS-PD1-MC-WWS", "549.00", 5,
                "Extra door or window contact for the Hikvision wireless alarm.",
                "Extra door or window contact for the Hikvision wireless alarm.",
                new String[]{"Wireless door and window contact", "Pairs with the Hikvision wireless alarm panel"}, "0.10"),

            new Seed("hikvision-panic-keyfob", "Hikvision DS-PKFE-5 Wireless Keyfob with Panic Button",
                "hikvision", "alarms", "Alarms", false, "DSPKFE5", "549.00", 6,
                "Extra remote to arm, disarm and send a panic alert.",
                "Extra remote to arm, disarm and send a panic alert.",
                new String[]{"Wireless remote with panic button", "Arms and disarms Hikvision wireless alarms"}, "0.10"),

            new Seed("hikvision-wireless-alarm-kit", "Hikvision DS-PWA32-NKGT Wireless Alarm Kit",
                "hikvision", "alarms", "Alarms", false, "DS-PWA32-NKGT", "1459.00", 131,
                "Self-install wireless alarm with app alerts over Wi-Fi or Ethernet.",
                "Self-install wireless alarm with app alerts over Wi-Fi or Ethernet.",
                new String[]{"Panel takes up to 32 wireless zones", "Wi-Fi and Ethernet with app push alerts (no GPRS)",
                    "Kit: panel, PIR detector, magnetic contact, remote", "Built-in rechargeable backup battery"}, "1.45"),

            // ---- Car ----
            new Seed("winx-track-essential-dash-cam", "WINX TRACK Essential 2K Dash Cam",
                "winx", "car", "Car", false, "WX-CD101", "859.00", 234,
                "2K windscreen camera with G-sensor crash recording.",
                "2K windscreen camera with G-sensor crash recording.",
                new String[]{"2K (2560 x 1440) at 25 fps", "130° field of view", "G-sensor saves footage on impact",
                    "F1.8 aperture; USB-C power"}, "0.27"),

            new Seed("winx-track-pro-dash-cam", "WINX TRACK Pro 2K Dash Cam",
                "winx", "car", "Car", false, "WX-CD102", "1329.00", 228,
                "2K dash cam with G-sensor crash recording and app connection.",
                "2K dash cam with G-sensor crash recording and app connection.",
                new String[]{"2K video with F1.8 lens for low light", "Built-in GPS logs speed and route",
                    "LED screen for on-device playback", "Impact detection locks footage; Wi-Fi app"}, "0.28"),

            // ---- Lighting ----
            new Seed("xiaomi-motion-night-light-3", "Xiaomi Motion Activated Night Light 3",
                "xiaomi", "lighting", "Lighting", false, "BHR8978GL", "629.00", 193,
                "Soft light that switches on when someone walks past at night.",
                "Soft light that switches on when someone walks past at night.",
                new String[]{"Switches on when it detects movement", "Light sensor keeps it off in daylight",
                    "Two lighting modes with a soft glow", "Magnetic base with strong adhesive; long battery life"}, "0.12"),

            new Seed("solarix-solar-flood-lamp", "Solarix Jortam 200W Solar Flood Lamp with Panel",
                "solarix", "lighting", "Lighting", false, "SOL-JTBS200WTYTZ", "1089.00", 24,
                "Solar flood lamp with a separate panel and remote; no wiring.",
                "Solar flood lamp with a separate panel and remote; no wiring.",
                new String[]{"Flood lamp with separate 15 W solar panel", "Up to 10 hours of light; 6500 K",
                    "IP66 with remote control"}, "2.25"),

            // ---- Memory Cards ----
            new Seed("apacer-128gb-microsdxc", "Apacer 128GB microSDXC V10 A1 Memory Card",
                "apacer", "memory-cards", "Memory Cards", false, "AP128GMCSX10UB-R", "729.00", 175,
                "128GB card for cameras and dash cams, up to 100 MB/s read.",
                "128GB card for cameras and dash cams, up to 100 MB/s read.",
                new String[]{"128GB, up to 100 MB/s read", "UHS-I, V10 video class, A1"}, "0.10"),

            new Seed("apacer-64gb-microsdhc", "Apacer 64GB microSDHC V10 A1 Memory Card",
                "apacer", "memory-cards", "Memory Cards", false, "AP64GMCSX10UB-R", "369.00", 455,
                "64GB card for cameras, dash cams and phones, up to 100 MB/s read.",
                "64GB card for cameras, dash cams and phones, up to 100 MB/s read.",
                new String[]{"64GB, up to 100 MB/s read", "UHS-I, V10 video class, A1"}, "0.10"),

            new Seed("hiksemi-256gb-high-endurance", "Hiksemi Guard 256GB High-Endurance microSDXC",
                "hiksemi", "memory-cards", "Memory Cards", false, "HS-TF-L2-256G", "3419.00", 142,
                "High-endurance card built for 24/7 recording in cameras and dash cams.",
                "High-endurance card built for 24/7 recording in cameras and dash cams.",
                new String[]{"Built for 24/7 video recording", "Up to 95 MB/s read, 50 MB/s write",
                    "Waterproof, shockproof, temperature resistant", "Health monitoring with Hikvision cameras"}, "0.01"),

            // ---- Power ----
            new Seed("conti-10000mah-mini-ups", "Conti 10,000mAh Smart Mini DC UPS",
                "conti", "power", "Power", false, "CUPS-18", "1089.00", 84,
                "Keeps your router and camera running for hours during load shedding.",
                "Keeps your router and camera running for hours during load shedding.",
                new String[]{"10,000mAh lithium battery", "DC output selectable 5V / 9V / 12V, plus USB and PoE ports",
                    "Runs a router and fibre ONT for about 3 to 4 hours", "Built-in AC charger; over 1,000 battery cycles"}, "0.60"),

            // ---- Security Cameras ----
            new Seed("mercusys-mc200", "Mercusys MC200 Pan/Tilt Home Security Wi-Fi Camera",
                "mercusys", "security-cameras", "Security Cameras", false, "MC200", "639.00", 8,
                "Full HD indoor camera that turns to cover the whole room.",
                "Full HD indoor camera that turns to cover the whole room.",
                new String[]{"1080p Full HD video", "360° horizontal pan with tilt", "Night vision up to 12 m; two-way audio",
                    "microSD up to 512GB or cloud; Alexa and Google Assistant"}, "0.35"),

            new Seed("tapo-c200-pan-tilt", "TP-Link Tapo C200 1080p Pan/Tilt Home Security Wi-Fi Camera",
                "tplink", "security-cameras", "Security Cameras", false, "TAPO-C200", "819.00", 6,
                "Best-selling indoor pan/tilt camera with night vision and motion alerts.",
                "Best-selling indoor pan/tilt camera with night vision and motion alerts.",
                new String[]{"1080p Full HD video", "360° pan and 114° tilt", "Night vision up to 9 m",
                    "Motion alerts plus a sound and light alarm"}, "0.50"),

            new Seed("xiaomi-c301-indoor", "Xiaomi Smart Camera C301 2K Indoor Wi-Fi Security Camera",
                "xiaomi", "security-cameras", "Security Cameras", false, "BHR8683GL", "1549.00", 127,
                "2K indoor pan/tilt camera with AI person detection.",
                "2K indoor pan/tilt camera with AI person detection.",
                new String[]{"2K (2304 x 1296) resolution", "Physical lens shield for privacy",
                    "Night vision with 6 x 940 nm infrared lights", "microSD (8–256GB) or cloud storage; 2.4 GHz Wi-Fi"}, "0.48"),

            new Seed("tapo-c216-indoor-outdoor", "TP-Link Tapo C216 2K Indoor/Outdoor Pan/Tilt Wi-Fi Camera",
                "tplink", "security-cameras", "Security Cameras", false, "TAPO-C216", "1189.00", 25,
                "2K pan/tilt camera with colour night vision, for inside or outside.",
                "2K pan/tilt camera with colour night vision, for inside or outside.",
                new String[]{"2K 3MP with colour night vision", "360° pan and 152° tilt with motion tracking",
                    "AI detection; sound and light alarm", "Two-way audio; microSD up to 512GB or cloud"}, "0.60"),

            new Seed("tapo-c310-outdoor", "TP-Link Tapo C310 3MP Outdoor Wi-Fi Security Camera",
                "tplink", "security-cameras", "Security Cameras", false, "TAPO-C310", "1219.00", 16,
                "Weatherproof outdoor camera with night vision up to 30 m.",
                "Weatherproof outdoor camera with night vision up to 30 m.",
                new String[]{"3MP (2304 x 1296) video", "Night vision up to 30 m", "Outdoor housing with Wi-Fi antennas",
                    "Motion alerts to your phone"}, "0.50"),

            new Seed("tapo-c660-solar-kit", "TP-Link Tapo C660 4K Solar-Powered Pan/Tilt Security Camera Kit",
                "tplink", "security-cameras", "Security Cameras", false, "TAPO-C660-KIT", "4549.00", 10,
                "4K pan/tilt camera with a solar panel, so it never needs a plug.",
                "4K pan/tilt camera with a solar panel, so it never needs a plug.",
                new String[]{"4K 8MP pan/tilt with 360° AI tracking", "Starlight colour night vision",
                    "10,000 mAh battery with solar charging", "microSD up to 512GB (card not included)"}, "1.55"),

            // ---- Smart Home ----
            new Seed("xiaomi-smart-doorbell-3s", "Xiaomi Smart Doorbell 3S",
                "xiaomi", "smart-home", "Smart Home", false, "BHR7068GL", "3409.00", 56,
                "2K battery video doorbell with an indoor chime in the box.",
                "2K battery video doorbell with an indoor chime in the box.",
                new String[]{"Built-in 2K camera, 107° vertical view", "Night vision with 6 infrared lights",
                    "5200 mAh battery; indoor chime included", "IP65 waterproof; Xiaomi security chip"}, "0.22"),

            new Seed("tapo-h100-hub", "TP-Link Tapo H100 Smart Hub with Chime",
                "tplink", "smart-home", "Smart Home", false, "TAPO-H100", "599.00", 3,
                "Connects Tapo sensors and buttons, with a built-in chime and alarm.",
                "Connects Tapo sensors and buttons, with a built-in chime and alarm.",
                new String[]{"Links Tapo sensors and buttons to your Wi-Fi", "Built-in chime and alarm sound",
                    "Needed for the T100, T110 and S200D"}, "0.10"),

            new Seed("xiaomi-smart-home-hub-2", "Xiaomi Smart Home Hub 2",
                "xiaomi", "smart-home", "Smart Home", false, "BHR6765GL", "1939.00", 20,
                "Central hub that links Xiaomi sensors and sends alerts when you are out.",
                "Central hub that links Xiaomi sensors and sends alerts when you are out.",
                new String[]{"Controls Zigbee, Bluetooth and Wi-Fi Xiaomi devices", "Supports up to 100 Bluetooth devices",
                    "Dual-band Wi-Fi plus RJ45 Ethernet port", "Runs Xiaomi Home automations between devices"}, "0.13"),

            new Seed("tapo-l535e-smart-bulb", "TP-Link Tapo L535E Smart Wi-Fi Bulb, Multicolour (E27)",
                "tplink", "smart-home", "Smart Home", false, "TAPO-L535E", "309.00", 6,
                "Bright 1055-lumen colour bulb you control from your phone or voice.",
                "Bright 1055-lumen colour bulb you control from your phone or voice.",
                new String[]{"E27 screw fitting, 1055 lumens (75 W equivalent)", "Multicolour and dimmable", "App and voice control"}, "0.10"),

            new Seed("xiaomi-smart-lock-keypad", "Xiaomi Self-Install Smart Lock with Keypad",
                "xiaomi", "smart-home", "Smart Home", false, "BHR07XDGL", "5259.00", 27,
                "Keyless smart lock you fit yourself, with keypad and app control.",
                "Keyless smart lock you fit yourself, with keypad and app control.",
                new String[]{"Unlock by fingerprint, PIN codes, app, remote or voice", "Works with Mi Home and Matter (Alexa, Google, Apple Home)",
                    "Lock status and access log in the app, no extra hub needed", "Locks itself when the door closes; rechargeable battery"}, "0.40"),

            new Seed("tapo-p110-smart-plug", "TP-Link Tapo P110 Mini Smart Wi-Fi Plug with Energy Monitoring",
                "tplink", "smart-home", "Smart Home", false, "TAPO-P110", "349.00", 6,
                "Switch appliances on and off from your phone, on a schedule or in Away Mode.",
                "Switch appliances on and off from your phone, on a schedule or in Away Mode.",
                new String[]{"App control with schedules and timers", "Energy monitoring", "Away mode; voice control", "2.4 GHz Wi-Fi only"}, "0.17"),

            new Seed("tapo-t100-motion-sensor", "TP-Link Tapo T100 Smart Motion Sensor",
                "tplink", "smart-home", "Smart Home", false, "TAPO-T100", "459.00", 1,
                "Detects movement up to 5 m and triggers alerts. Needs a Tapo hub.",
                "Detects movement up to 5 m and triggers alerts. Needs a Tapo hub.",
                new String[]{"120° / 5 m motion detection", "Battery powered (CR2450 included)",
                    "Triggers alerts and Tapo smart actions", "Needs a Tapo hub (H100 or H200)"}, "0.10"),

            new Seed("tapo-t110-contact-sensor", "TP-Link Tapo T110 Smart Contact Sensor",
                "tplink", "smart-home", "Smart Home", false, "TAPO-T110", "369.00", 3,
                "Phone alert the moment a door or window opens. Needs a Tapo hub.",
                "Phone alert the moment a door or window opens. Needs a Tapo hub.",
                new String[]{"Alerts you when a door or window opens", "About 2 years per battery",
                    "Triggers Tapo automations", "Needs a Tapo hub (H100 or H200)"}, "0.10"),

            new Seed("xiaomi-motion-sensor-2s", "Xiaomi Motion Sensor 2S",
                "xiaomi", "smart-home", "Smart Home", false, "BHR8995GL", "549.00", 110,
                "Motion sensor for Xiaomi Home automations. Needs a Xiaomi hub.",
                "Motion sensor for Xiaomi Home automations. Needs a Xiaomi hub.",
                new String[]{"Detects motion and micro-motion", "Measures light level (0–1000 lux) for automations",
                    "Up to 3-year battery life", "Bluetooth LE; triggers other Xiaomi devices"}, "0.04"),

            new Seed("xiaomi-window-door-sensor-2", "Xiaomi Window and Door Sensor 2",
                "xiaomi", "smart-home", "Smart Home", false, "BHR5154GL", "549.00", 94,
                "Tells you when a door or window opens or closes.",
                "Tells you when a door or window opens or closes.",
                new String[]{"Alerts your phone when a door or window opens", "Left-open reminder and event history",
                    "Built-in light sensor", "Bluetooth 5.1 LE"}, "0.06"),

            // ---- Trackers ----
            new Seed("ugreen-finetrack-mini-apple", "UGREEN FineTrack Mini Smart Finder for Apple",
                "ugreen", "trackers", "Trackers", false, "CM520-60387", "439.00", 39,
                "Small tracker for iPhone owners on the Apple Find My network.",
                "Small tracker for iPhone owners on the Apple Find My network.",
                new String[]{"Uses the Apple Find My network", "Left-behind alerts", "80 dB audible alert",
                    "Replaceable CR2032 battery, up to 18 months"}, "0.09"),

            new Seed("ugreen-finetrack-slim-card", "UGREEN FineTrack Slim Pro Card Tracker for Android & iOS",
                "ugreen", "trackers", "Trackers", false, "CM915-75644", "649.00", 46,
                "Card-shaped tracker that slips into a wallet, for iPhone or Android.",
                "Card-shaped tracker that slips into a wallet, for iPhone or Android.",
                new String[]{"Card-shaped to fit a wallet or bag", "Works with iPhone (Find My) and Android",
                    "IP68 water and dust resistance", "Up to 5 years of rated battery life"}, "0.11"),

            new Seed("ugreen-bluetooth-tracker", "UGREEN Smart Bluetooth Tracker for Android & iOS",
                "ugreen", "trackers", "Trackers", false, "CM916-75646", "329.00", 0,
                "Rechargeable tracker that works with both iPhone and Android.",
                "Rechargeable tracker that works with both iPhone and Android.",
                new String[]{"Works with Apple Find My and Google Find Hub", "Recharges by USB-C, up to 365 days per charge",
                    "Built-in audible finder", "Apple and Google certified"}, "0.10"),

            new Seed("ugreen-finder-tag-samsung", "UGREEN Smart Finder Tag for Samsung Galaxy",
                "ugreen", "trackers", "Trackers", false, "CM829-55769", "499.00", 61,
                "Tracker for Samsung Galaxy phone owners, via SmartThings.",
                "Tracker for Samsung Galaxy phone owners, via SmartThings.",
                new String[]{"Works with Samsung SmartThings on Galaxy phones and tablets", "Last known location beyond Bluetooth range",
                    "Loud 80 dB ring with custom tones", "Up to 18-month battery; double-tap to ring your phone"}, "0.09"),

            new Seed("xiaomi-tag-tracker-1pack", "Xiaomi Tag Bluetooth Smart Tracker (1 Pack)",
                "xiaomi", "trackers", "Trackers", false, "BHR08SPGL", "539.00", 137,
                "One tag for keys or a bag, works with iPhone or Android.",
                "One tag for keys or a bag, works with iPhone or Android.",
                new String[]{"Works with Apple Find My or Google Find Hub (chosen at setup)", "Built-in buzzer to find nearby items",
                    "Last-seen location on a map", "IP67; replaceable CR2032 battery lasts over a year"}, "0.04"),

            new Seed("xiaomi-tag-tracker-4pack", "Xiaomi Tag Bluetooth Smart Tracker (4 Pack)",
                "xiaomi", "trackers", "Trackers", false, "BHR08SKGL", "1859.00", 34,
                "Four tags for keys, bag, wallet and luggage, works with iPhone or Android.",
                "Four tags for keys, bag, wallet and luggage, works with iPhone or Android.",
                new String[]{"Four tags: works with Apple Find My or Google Find Hub", "Built-in buzzer to find nearby items",
                    "Last-seen location on a map", "IP67; replaceable CR2032 battery lasts over a year"}, "0.10"),

            // ---- Bundles: Security Cameras ----
            new Seed("ready-to-record-home-camera-bundle", "Ready-to-Record Home Camera Bundle: Mercusys MC200 + 64GB microSD",
                "mercusys", "security-cameras", "Security Cameras", true, "BND-CAM-RECORD", "999.00", 8,
                "A pan/tilt home camera with the memory card already in the box, so it records from day one.",
                "Everything you need to start recording at home. The Mercusys MC200 turns 360° to cover the whole room, sees in the dark and talks both ways through the Mercusys app. The 64GB card saves motion clips on the camera itself, so you can play back footage without paying for cloud storage.",
                new String[]{"In the bundle: Mercusys MC200 Pan/Tilt Wi-Fi Camera (R639 alone)",
                    "In the bundle: Apacer 64GB microSDHC V10 A1 Memory Card (R369 alone)",
                    "Good to know: The camera supports cards up to 512GB if you want more space later"}, "0.50"),

            new Seed("two-room-tapo-camera-pack", "Two-Room Camera Pack: 2 x Tapo C216 2K + 2 x 64GB microSD",
                "tplink", "security-cameras", "Security Cameras", true, "BND-CAM-2ROOM", "3089.00", 12,
                "Two 2K pan/tilt cameras with memory cards, to cover two rooms or a room and the yard.",
                "Cover the lounge and the back door, or the house and a granny flat. Each Tapo C216 records in 2K, turns 360° to follow movement and shows colour at night. Both cameras run in one Tapo app, and each comes with its own 64GB card for local recording.",
                new String[]{"In the bundle: 2 x TP-Link Tapo C216 2K Indoor/Outdoor Camera (R1,189 alone, each)",
                    "In the bundle: 2 x Apacer 64GB microSDHC Memory Card (R369 alone, each)",
                    "Good to know: The C216 works indoors or outdoors and takes cards up to 512GB"}, "1.20"),

            new Seed("baby-and-pet-room-camera-bundle", "Baby & Pet Room Bundle: Tapo C200 Camera + Xiaomi Motion Night Light 3 + 64GB microSD",
                "tplink", "security-cameras", "Security Cameras", true, "BND-CAM-BABYPET", "1809.00", 6,
                "Watch the nursery or your pets from your phone, with a soft night light that comes on when someone walks in.",
                "The Tapo C200 turns and tilts to follow a crawling baby or a curious puppy, with night vision, two-way talk and motion alerts. The Xiaomi night light switches on by itself when someone walks past, so night feeds and checks are easier, and the camera picture is clearer. The 64GB card stores clips on the camera.",
                new String[]{"In the bundle: TP-Link Tapo C200 1080p Pan/Tilt Camera (R819 alone)",
                    "In the bundle: Xiaomi Motion Activated Night Light 3 (R629 alone)",
                    "In the bundle: Apacer 64GB microSDHC Memory Card (R369 alone)",
                    "Good to know: The camera uses the Tapo app; the night light works on its own and needs no app"}, "1.00"),

            new Seed("solar-security-camera-bundle", "Solar Security Camera Bundle: Tapo C660 4K Solar Kit + 128GB microSD",
                "tplink", "security-cameras", "Security Cameras", true, "BND-CAM-SOLAR", "5269.00", 10,
                "A 4K pan/tilt camera that charges from the sun, with a memory card, for places with no plug.",
                "Ideal for gates, driveways and smallholdings. The Tapo C660 records in 4K, turns 360° to track movement and shows colour at night with two spotlights. The solar panel keeps its 10,000mAh battery charged, so there is no wiring. The 128GB card stores footage on the camera.",
                new String[]{"In the bundle: TP-Link Tapo C660 4K Solar-Powered Pan/Tilt Kit (R4,549 alone)",
                    "In the bundle: Apacer 128GB microSDXC Memory Card (R729 alone)",
                    "Good to know: No card comes in the Tapo box, which is why this bundle adds one. The camera takes cards up to 512GB"}, "1.65"),

            new Seed("outdoor-night-watch-bundle", "Outdoor Night Watch Bundle: Tapo C310 + Solarix 200W Solar Flood Lamp + 64GB microSD",
                "tplink", "security-cameras", "Security Cameras", true, "BND-CAM-NIGHT", "2669.00", 16,
                "An outdoor camera plus a solar flood lamp that lights up the yard for clearer night footage.",
                "The Tapo C310 watches your yard or driveway in 3MP, with night vision up to 30 m. The Solarix flood lamp charges from its own solar panel and lights the area at night, so the camera picks up more detail. The 64GB card stores clips on the camera.",
                new String[]{"In the bundle: TP-Link Tapo C310 3MP Outdoor Camera (R1,219 alone)",
                    "In the bundle: Solarix Jortam 200W Solar Flood Lamp (R1,089 alone)",
                    "In the bundle: Apacer 64GB microSDHC Memory Card (R369 alone)",
                    "Good to know: The flood lamp has no motion sensor; it runs on its remote and timer"}, "2.85"),

            new Seed("load-shedding-camera-bundle", "Load-Shedding Camera Bundle: Xiaomi C301 + Conti 10,000mAh Mini DC UPS + 64GB microSD",
                "xiaomi", "security-cameras", "Security Cameras", true, "BND-POWER-LOADSHED", "2999.00", 84,
                "A 2K home camera that keeps recording during load shedding, because the UPS keeps it and your router on.",
                "A Wi-Fi camera goes dark in a power cut unless the router stays on too. The Conti mini DC UPS powers your router from its DC port and the Xiaomi C301 camera from its USB port. The C301 records in 2K, turns to cover the room and spots people with AI detection. The 64GB card keeps recording locally.",
                new String[]{"In the bundle: Xiaomi Smart Camera C301 2K Indoor Camera (R1,549 alone)",
                    "In the bundle: Conti 10,000mAh Smart Mini DC UPS (R1,089 alone)",
                    "In the bundle: Apacer 64GB microSDHC Memory Card (R369 alone)",
                    "Good to know: Set the UPS DC output to match your router (9V or 12V). Run time is shorter than the 3 to 4 hours quoted for a router alone, because the camera shares the battery"}, "1.08"),

            // ---- Bundles: Smart Home ----
            new Seed("tapo-door-and-window-alert-kit", "Tapo Door & Window Alert Kit: H100 Hub + T110 Contact Sensor + T100 Motion Sensor",
                "tplink", "smart-home", "Smart Home", true, "BND-SMART-TAPOALERT", "1419.00", 1,
                "Get a phone alert when a door opens or someone moves, with the hub and sensors included.",
                "Tapo sensors only work with a Tapo hub, so this kit includes one. The T110 alerts you when a door or window opens; the T100 picks up movement in a passage or room. The H100 hub links both sensors to your Wi-Fi and doubles as a loud alarm and doorbell chime.",
                new String[]{"In the bundle: TP-Link Tapo H100 Smart Hub with Chime (R599 alone)",
                    "In the bundle: TP-Link Tapo T110 Smart Contact Sensor (R369 alone)",
                    "In the bundle: TP-Link Tapo T100 Smart Motion Sensor (R459 alone)",
                    "Good to know: The hub takes up to 64 Tapo sensors and buttons, so you can add more later"}, "0.30"),

            new Seed("xiaomi-door-and-window-alert-kit", "Xiaomi Door & Window Alert Kit: Hub 2 + 2 x Door Sensor 2 + Motion Sensor 2S",
                "xiaomi", "smart-home", "Smart Home", true, "BND-SMART-XIAOMIALERT", "3579.00", 20,
                "Cover the front and back doors and a passage, with the Xiaomi hub you need for alerts away from home.",
                "Two Xiaomi door sensors tell you when the front and back doors open, and the Motion Sensor 2S watches a passage or room. The Xiaomi Smart Home Hub 2 connects them all, so you get alerts on your phone even when you are not at home.",
                new String[]{"In the bundle: Xiaomi Smart Home Hub 2 (R1,939 alone)",
                    "In the bundle: 2 x Xiaomi Window and Door Sensor 2 (R549 alone, each)",
                    "In the bundle: Xiaomi Motion Sensor 2S (R549 alone)",
                    "Good to know: The Motion Sensor 2S needs a Bluetooth Mesh gateway such as the Hub 2 to work fully"}, "0.28"),

            new Seed("away-from-home-tapo-bundle", "Away-From-Home Bundle: Tapo C216 Camera + P110 Smart Plug + L535E Smart Bulb + 64GB microSD",
                "tplink", "smart-home", "Smart Home", true, "BND-SMART-AWAY", "2199.00", 6,
                "Keep an eye on the house and make it look lived in while you are away, all from one Tapo app.",
                "The Tapo C216 camera watches the house in 2K with colour night vision. The P110 smart plug's Away Mode switches a lamp on and off at random so the house looks occupied. Add the colour smart bulb to a main light and control it from your phone. Everything runs in one Tapo app, and the 64GB card records on the camera.",
                new String[]{"In the bundle: TP-Link Tapo C216 2K Indoor/Outdoor Camera (R1,189 alone)",
                    "In the bundle: TP-Link Tapo P110 Mini Smart Wi-Fi Plug (R349 alone)",
                    "In the bundle: TP-Link Tapo L535E Smart Wi-Fi Bulb (R309 alone)",
                    "In the bundle: Apacer 64GB microSDHC Memory Card (R369 alone)",
                    "Good to know: The smart plug and bulb need 2.4 GHz Wi-Fi"}, "0.97"),

            new Seed("xiaomi-front-door-bundle", "Xiaomi Front Door Bundle: Smart Doorbell 3S + Self-Install Smart Lock",
                "xiaomi", "smart-home", "Smart Home", true, "BND-DOOR-FRONT", "8659.00", 27,
                "See who is at the door and let them in from one app, with a keyless lock you fit yourself.",
                "The Xiaomi Smart Doorbell 3S shows a 2K, 180° view of your doorstep and rings an indoor chime that comes in the box. The self-install smart lock opens with a keypad code or the Xiaomi Home app, so there are no keys to lose. Both run in the same app.",
                new String[]{"In the bundle: Xiaomi Smart Doorbell 3S (R3,409 alone)",
                    "In the bundle: Xiaomi Self-Install Smart Lock with Keypad (R5,259 alone)",
                    "Good to know: The doorbell runs on a rechargeable battery that needs charging about three times a year"}, "0.62"),

            // ---- Bundles: Alarms ----
            new Seed("hikvision-whole-house-wireless-alarm-bundle", "Hikvision Whole-House Wireless Alarm Bundle: Alarm Kit + 2 Extra Door Contacts + Extra Remote",
                "hikvision", "alarms", "Alarms", true, "BND-ALARM-HOUSE", "3089.00", 2,
                "A self-install wireless alarm with enough door contacts and remotes for a typical family home.",
                "The Hikvision wireless alarm kit sends alerts to your phone over Wi-Fi or Ethernet and comes with one door contact, one motion detector and one remote. This bundle adds two more door contacts and a second remote with a panic button, so you can cover more doors and give every adult a remote.",
                new String[]{"In the bundle: Hikvision DS-PWA32-NKGT Wireless Alarm Kit (R1,459 alone)",
                    "In the bundle: 2 x Hikvision DS-PD1-MC-WWS Door/Window Contact (R549 alone, each)",
                    "In the bundle: Hikvision DS-PKFE-5 Wireless Keyfob with Panic Button (R549 alone)",
                    "Good to know: All parts are the same 868 MHz Hikvision models, and the panel takes up to 32 wireless devices"}, "1.65"),

            // ---- Bundles: Car ----
            new Seed("dash-cam-starter-bundle", "Dash Cam Starter Bundle: WINX TRACK Essential 2K + 64GB microSD",
                "winx", "car", "Car", true, "BND-CAR-DASH", "1229.00", 234,
                "A 2K dash cam with a memory card included, so it records from your first drive.",
                "The WINX TRACK Essential records the road in 2K and saves a protected clip if it senses a bump. WINX sells the camera without a card, so this bundle adds a 64GB card and you are ready to go.",
                new String[]{"In the bundle: WINX TRACK Essential 2K Dash Cam (R859 alone)",
                    "In the bundle: Apacer 64GB microSDHC Memory Card (R369 alone)",
                    "Good to know: Replace the card every year or so if you drive a lot, as loop recording wears cards out"}, "0.37"),

            new Seed("all-day-dash-cam-bundle", "All-Day Dash Cam Bundle: WINX TRACK Pro 2K + Hiksemi 256GB High-Endurance microSD",
                "winx", "car", "Car", true, "BND-CAR-DASHPRO", "4749.00", 142,
                "A 2K dash cam with a high-endurance card made for drivers who record all day.",
                "Built for ride-hailing, delivery and fleet drivers. The WINX TRACK Pro records in 2K and protects crash clips automatically. The Hiksemi Guard 256GB card is a high-endurance card made for non-stop recording, and is the largest card the camera supports.",
                new String[]{"In the bundle: WINX TRACK Pro 2K Dash Cam (R1,329 alone)",
                    "In the bundle: Hiksemi Guard 256GB High-Endurance microSDXC (R3,419 alone)",
                    "Good to know: The WINX TRACK Pro supports cards up to 256GB"}, "0.29")
        );
    }

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, Category> categories = new HashMap<>();
        for (Category c : categoryRepository.findAll()) {
            categories.put(c.getKey(), c);
        }

        List<Seed> seeds = catalog();
        int created = 0;

        for (Seed s : seeds) {
            if (productRepository.findBySlug(s.slug()).isPresent()) continue; // never overwrite an existing row

            Category category = categories.computeIfAbsent(s.categoryKey(), key -> {
                Category c = new Category(key, s.categoryLabel(), categories.size() + 10);
                return categoryRepository.save(c);
            });

            BigDecimal price = new BigDecimal(s.price());
            // Placeholder cost at a flat 65% of selling price — the source catalogue only lists
            // selling price. Correct via the admin back-office once real supplier costs are known.
            BigDecimal costPrice = price.multiply(BigDecimal.valueOf(0.65)).setScale(2, RoundingMode.HALF_UP);

            Product product = new Product(
                s.slug(), s.name(), s.brand(), category, s.bundle(), s.sku(),
                s.tagline(), s.description(), costPrice, price, s.stockQty(),
                new BigDecimal(s.weightKg())
            );
            for (String specText : s.specs()) {
                product.addSpec(specText);
            }
            product.setImageUrl("/products/" + s.slug() + ".jpg");
            productRepository.save(product);
            created++;
        }

        if (created > 0) {
            System.out.println("Catalog expansion: seeded " + created + " new products/bundles from Products-and-Bundles_2.pdf");
        }
    }
}