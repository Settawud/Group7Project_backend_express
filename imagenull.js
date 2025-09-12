import mongoose from "mongoose";
import { Product } from "./models/Product.js";
import { Color } from "./models/Color.js";


const rawProductsData = [
  {
    name: "เก้าอี้ Ergonomics รุ่น ErgoFlow",
    description: "เก้าอี้สำนักงานเพื่อสุขภาพที่ออกแบบมาเพื่อรองรับสรีระของผู้ใช้งานอย่างแท้จริง ด้วยระบบ Lumbar Support ที่ปรับได้อัตโนมัติ ช่วยลดอาการปวดหลังและคอจากการนั่งทำงานเป็นเวลานาน เบาะนั่งดีไซน์พิเศษช่วยกระจายน้ำหนัก ลดแรงกดทับ และพนักพิงทำจากผ้าตาข่ายคุณภาพสูง ระบายอากาศได้ดีเยี่ยม ให้คุณนั่งสบายตลอดวัน โครงสร้างทำจากเหล็กคุณภาพดีทนทานแข็งแรง ปรับความสูงและมุมเอนได้ตามต้องการ",
    category: "เก้าอี้",
    trial: false,
    tags: ["เก้าอี้สุขภาพ", "เก้าอี้ทำงาน", "ปรับได้"],
    material: "เบาะผ้าตาข่าย, โครงเหล็กชุบโครเมียม",
    thumbnails: [],
    dimension: {
      width: 65,
      height: 125,
      depth: 60,
      weight: 18,
    },
    variants: [
      {
        // No _id here, let Mongoose handle it for subdocuments
        trial: false,
        colorNameTh: "ดำ", // Use colorNameTh to look up the Color _id
        price: 5990,
        quantityInStock: 10,
      },
      {
        trial: false,
        colorNameTh: "ขาว",
        price: 6190,
        quantityInStock: 5,
      },
      {
        trial: true,
        colorNameTh: "ดำ",
        price: 599,
        quantityInStock: 2,
      },
      {
        trial: true,
        colorNameTh: "ขาว",
        price: 619,
        quantityInStock: 0,
      },
    ],
  },
  {
    name: "เก้าอี้ Ergonomics รุ่น LumbarPro",
    description: "เก้าอี้รุ่นนี้ถูกออกแบบมาเพื่อการรองรับช่วงเอวและหลังส่วนล่างโดยเฉพาะ ด้วยระบบ Lumbar Support ที่สามารถปรับความลึกและความสูงได้ ให้คุณสามารถปรับให้เข้ากับส่วนโค้งของหลังได้อย่างแม่นยำ ช่วยให้กระดูกสันหลังอยู่ในแนวที่ถูกต้อง พนักพิงศีรษะสามารถปรับองศาได้ เพื่อลดอาการปวดคอและบ่าจากการนั่งนานๆ",
    category: "เก้าอี้",
    trial: false,
    tags: ["เก้าอี้เอว", "รองรับหลัง", "Ergonomics"],
    material: "หนัง PU, โครงเหล็ก",
    thumbnails: [],
    dimension: {
      width: 70,
      height: 130,
      depth: 65,
      weight: 22,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ดำ",
        price: 7500,
        quantityInStock: 3,
      },
      {
        trial: true,
        colorNameTh: "ดำ",
        price: 750,
        quantityInStock: 1,
      },
    ],
  },
  {
    name: "เก้าอี้ Ergonomics รุ่น MeshAir",
    description: "ดีไซน์ที่ทันสมัยและฟังก์ชันการใช้งานที่ครบครัน พนักพิงและเบาะทำจากตาข่าย Mesh คุณภาพสูงที่ช่วยระบายอากาศได้ดีเยี่ยม ลดการสะสมความร้อนขณะนั่งทำงาน ทำให้รู้สึกเย็นสบายแม้ในวันอากาศร้อน พนักพิงรูปทรง S-Curve ช่วยรองรับสรีระได้อย่างเป็นธรรมชาติ",
    category: "เก้าอี้",
    trial: false,
    tags: ["เก้าอี้ตาข่าย", "ระบายอากาศ", "โมเดิร์น"],
    material: "เบาะผ้าตาข่ายคุณภาพสูง, โครงอะลูมิเนียม",
    thumbnails: [],
    dimension: {
      width: 62,
      height: 115,
      depth: 55,
      weight: 16,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "เทา",
        price: 4800,
        quantityInStock: 8,
      },
      {
        trial: false,
        colorNameTh: "ส้ม",
        price: 4950,
        quantityInStock: 0,
      },
    ],
  },
  {
    name: "เก้าอี้ Gaming Ergonomics รุ่น Nitro",
    description: "เก้าอี้เกมมิ่งที่ไม่ได้มีดีแค่รูปลักษณ์ ด้วยการออกแบบตามหลักสรีรศาสตร์ที่ครบถ้วน รองรับทุกท่วงท่าในการเล่นเกมที่ยาวนาน ช่วยลดอาการปวดเมื่อยได้อย่างมีประสิทธิภาพ มีที่พักแขน 4D ที่ปรับได้ทุกทิศทาง และเบาะรองหลัง/คอที่ช่วยซัพพอร์ตอย่างเต็มที่",
    category: "เก้าอี้",
    trial: false,
    tags: ["เก้าอี้เกมมิ่ง", "เกมมิ่ง", "Ergonomics"],
    material: "หนังเทียม PVC, โครงเหล็ก",
    thumbnails: [],
    dimension: {
      width: 75,
      height: 140,
      depth: 70,
      weight: 25,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "แดง", // For "แดง-ดำ", we'll just pick 'แดง' as the main color for simplicity for now.
                            // If you need compound colors, that's a more complex schema design.
        price: 8900,
        quantityInStock: 6,
      },
    ],
  },
  {
    name: "เก้าอี้ Ergonomics รุ่น Comfort",
    description: "เก้าอี้ทำงานสไตล์โมเดิร์นรุ่นนี้ ออกแบบมาเพื่อมอบความสะดวกสบายสูงสุดในการนั่งทำงานเป็นเวลานาน เบาะและพนักพิงหุ้มด้วยหนังเทียมสีขาวครีมคุณภาพดี ดูหรูหราและทำความสะอาดง่าย มาพร้อมพนักพิงศีรษะปรับระดับได้ รองรับสรีระอย่างลงตัว /n ที่วางแขนสามารถปรับได้ เพิ่มความสบายในการใช้งาน ขาเก้าอี้ทำจากวัสดุโลหะแข็งแรง มาพร้อมล้อเลื่อนเคลื่อนที่ได้สะดวก เหมาะสำหรับใช้ในออฟฟิศ ห้องทำงานที่บ้าน หรือห้องประชุม /n ✔ ดีไซน์ทันสมัย หรูหรา /n ✔ เบาะนุ่ม นั่งสบาย รองรับสรีระ /n ✔ พนักพิงศีรษะปรับได้ /n ✔ โครงสร้างแข็งแรง ทนทาน /n ✔ ล้อเลื่อนหมุนได้รอบทิศทาง /n เหมาะสำหรับคนที่มองหาเก้าอี้ทำงานที่ทั้งสวยงามและช่วยเพิ่มประสิทธิภาพในการทำงานทุกวัน ✨",
    category: "เก้าอี้",
    trial: false,
    tags: ["เก้าอี้ขนาดเล็ก", "ประหยัดพื้นที่"],
    material: "ผ้า Polyester, โครงพลาสติก",
    thumbnails: [],
    dimension: {
      width: 55,
      height: 105,
      depth: 50,
      weight: 12,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ดำ",
        price: 3200,
        quantityInStock: 7,
      },
      {
        trial: false,
        colorNameTh: "ขาว",
        price: 3200,
        quantityInStock: 4,
      },
      {
        trial: false,
        colorNameTh: "เทา",
        price: 3200,
        quantityInStock: 0,
      },
      {
        trial: true,
        colorNameTh: "ดำ",
        price: 320,
        quantityInStock: 1,
      },
      {
        trial: true,
        colorNameTh: "เทา",
        price: 320,
        quantityInStock: 1,
      },
    ],
  },
  {
    name: "โต๊ะ Ergonomics ปรับระดับไฟฟ้า รุ่น AscendPro",
    description: "เปลี่ยนอิริยาบถจากการนั่งไปยืนได้อย่างง่ายดายด้วยระบบปรับระดับไฟฟ้าอันทรงพลัง โต๊ะรุ่นนี้ช่วยให้คุณสามารถปรับความสูงได้ตามต้องการ ลดความเมื่อยล้าจากการนั่งเป็นเวลานานได้เป็นอย่างดี หน้าโต๊ะทำจากวัสดุคุณภาพสูง ทนทานต่อรอยขีดข่วนและทำความสะอาดง่าย",
    category: "โต๊ะ",
    trial: false,
    tags: ["โต๊ะปรับระดับ", "โต๊ะยืน", "โต๊ะทำงานไฟฟ้า"],
    material: "ไม้ MDF เคลือบเมลามีน, ขาเหล็ก",
    thumbnails: [],
    dimension: {
      width: 120,
      height: 75,
      depth: 60,
      weight: 35,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ขาว",
        price: 9500,
        quantityInStock: 5,
      },
      {
        trial: true,
        colorNameTh: "ขาว",
        price: 950,
        quantityInStock: 1,
      },
    ],
  },
  {
    name: "โต๊ะทำงานเพื่อสุขภาพ รุ่น Sit-Stand",
    description: "โต๊ะทำงานที่สามารถปรับระดับความสูงได้ด้วยมือ เหมาะสำหรับคนที่ต้องการสลับการทำงานระหว่างนั่งและยืน หน้าโต๊ะกว้างขวางมีพื้นที่วางของได้เต็มที่ ขาโต๊ะแข็งแรงมั่นคง",
    category: "โต๊ะ",
    trial: false,
    tags: ["โต๊ะทำงาน", "ปรับความสูง", "สุขภาพ"],
    material: "ไม้ Particle Board, ขาเหล็ก",
    thumbnails: [],
    dimension: {
      width: 100,
      height: 70,
      depth: 60,
      weight: 28,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "น้ำตาลเข้ม",
        price: 6800,
        quantityInStock: 0,
      },
    ],
  },
  {
    name: "โต๊ะทำงาน รุ่น MiniErgo",
    description: "โต๊ะดีไซน์มินิมอลที่ไม่ได้แค่สวยงามแต่ยังคำนึงถึงหลักสรีรศาสตร์ เหมาะสำหรับพื้นที่จำกัด",
    category: "โต๊ะ",
    trial: false,
    tags: ["โต๊ะมินิมอล", "จัดระเบียบ", "ประหยัดพื้นที่"],
    material: "ไม้ยางพารา",
    thumbnails: [],
    dimension: {
      width: 110,
      height: 75,
      depth: 55,
      weight: 20,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ไม้ธรรมชาติ",
        price: 4200,
        quantityInStock: 12,
      },
      {
        trial: true,
        colorNameTh: "ไม้ธรรมชาติ",
        price: 420,
        quantityInStock: 1,
      },
    ],
  },
  {
    name: "โต๊ะทำงานรุ่น ErgoCurve",
    description: "เติมเต็มการทำงานและการพักผ่อนอย่างลงตัวด้วยโต๊ะทำงานปรับระดับไฟฟ้าดีไซน์โมเดิร์น หน้าท็อปทำจากไม้คุณภาพสูง ลายไม้ธรรมชาติสวยงาม แข็งแรง ทนทาน พร้อมดีไซน์ขอบเว้าโค้งเพื่อรองรับสรีระการนั่ง-ยืนได้อย่างสบาย /n ฟังก์ชันปรับระดับไฟฟ้า: สามารถปรับความสูงได้ตามต้องการ รองรับทั้งการนั่งและยืนทำงาน เพียงกดปุ่มควบคุม /n ดีไซน์ทันสมัย: ขาโต๊ะโลหะแข็งแรง สีดำด้าน เสริมความเรียบหรู เหมาะกับทุกสไตล์การตกแต่ง /n พื้นที่ใช้งานกว้าง: รองรับการใช้งานคอมพิวเตอร์ อุปกรณ์เสริม และเอกสารได้ครบถ้วน /n เพื่อสุขภาพที่ดีกว่า: ช่วยลดอาการเมื่อยล้าจากการนั่งทำงานนานๆ ส่งเสริมการทำงานอย่างมีประสิทธิภาพ /n โต๊ะทำงานที่ทั้งสวยงาม แข็งแรง และออกแบบมาเพื่อคนรุ่นใหม่ที่ใส่ใจสุขภาพ",
    category: "โต๊ะ",
    trial: false,
    tags: ["โต๊ะคอม", "โต๊ะขนาดเล็ก", "ปรับระดับ"],
    material: "ไม้ MDF",
    thumbnails: [],
    dimension: {
      width: 80,
      height: 80,
      depth: 50,
      weight: 15,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ขาว",
        price: 3500,
        quantityInStock: 6,
      },
    ],
  },
  {
    name: "โต๊ะทำงานเข้ามุม Ergonomics รุ่น CornerFlex",
    description: "ใช้พื้นที่ได้อย่างเต็มประสิทธิภาพด้วยโต๊ะทำงานเข้ามุมรูปตัว L ที่ให้พื้นที่กว้างขวางสำหรับวางเอกสารและอุปกรณ์ต่างๆ ได้อย่างเป็นระเบียบ เหมาะสำหรับงานที่ต้องใช้อุปกรณ์หลายชิ้น หรือต้องการพื้นที่ทำงานที่กว้างเป็นพิเศษ",
    category: "โต๊ะ",
    trial: false,
    tags: ["โต๊ะเข้ามุม", "โต๊ะตัว L", "พื้นที่กว้าง"],
    material: "ไม้ MDF, เหล็ก",
    thumbnails: [],
    dimension: {
      width: 150,
      height: 75,
      depth: 150,
      weight: 45,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ดำ",
        price: 11000,
        quantityInStock: 3,
      },
    ],
  },
  {
    name: "ที่วางเท้าปรับระดับ รุ่น FootRest Pro",
    description: "ช่วยยกเท้าและขาให้สูงขึ้นเพื่อลดแรงกดทับที่หลังส่วนล่าง ทำให้ท่าทางการนั่งถูกต้อง และช่วยให้ระบบไหลเวียนโลหิตดีขึ้น มีผิวสัมผัสแบบปุ่มนวดเท้า ช่วยให้ผ่อนคลายขณะนั่งทำงาน",
    category: "อุปกรณ์เสริม",
    trial: false,
    tags: ["ที่วางเท้า", "สุขภาพเท้า", "รองขา"],
    material: "พลาสติก ABS, ยางกันลื่น",
    thumbnails: [],
    dimension: {
      width: 45,
      height: 15,
      depth: 30,
      weight: 2,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ดำ",
        price: 890,
        quantityInStock: 20,
      },
      {
        trial: true,
        colorNameTh: "ดำ",
        price: 89,
        quantityInStock: 5,
      },
    ],
  },
  {
    name: "ที่รองข้อมือคีย์บอร์ด รุ่น WristPad",
    description: "ช่วยรองรับข้อมือและแขนขณะพิมพ์งาน ลดความตึงเครียดของกล้ามเนื้อ และลดความเสี่ยงของอาการปวดข้อมือที่เกิดจากการใช้งานนานๆ ภายในเป็นวัสดุเมมโมรี่โฟมที่คืนรูปได้ดี หุ้มด้วยผ้า Lycra ที่ให้สัมผัสสบาย",
    category: "อุปกรณ์เสริม",
    trial: false,
    tags: ["ที่รองข้อมือ", "คีย์บอร์ด", "ลดอาการปวด"],
    material: "เมมโมรี่โฟม",
    thumbnails: [],
    dimension: {
      width: 44,
      height: 2,
      depth: 8,
      weight: 0.5,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ดำ",
        price: 350,
        quantityInStock: 15,
      },
      {
        trial: false,
        colorNameTh: "เทา",
        price: 350,
        quantityInStock: 8,
      },
      {
        trial: true,
        colorNameTh: "ดำ",
        price: 35,
        quantityInStock: 2,
      },
      {
        trial: true,
        colorNameTh: "เทา",
        price: 35,
        quantityInStock: 1,
      },
    ],
  },
  {
    name: "แท่นวางจอคอมพิวเตอร์ รุ่น Monitor Riser",
    description: "ยกระดับจอคอมพิวเตอร์ให้อยู่ในระดับสายตาที่เหมาะสม ช่วยปรับท่าทางการนั่งให้ถูกต้อง ลดอาการก้มมองจอจนเกิดอาการปวดคอ มีพื้นที่ใต้แท่นวางสำหรับเก็บของหรือจัดระเบียบโต๊ะทำงาน",
    category: "อุปกรณ์เสริม",
    trial: false,
    tags: ["แท่นวางจอ", "ปรับระดับจอ", "จัดโต๊ะ"],
    material: "ไม้ยางพารา",
    thumbnails: [],
    dimension: {
      width: 50,
      height: 10,
      depth: 20,
      weight: 3,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ไม้ธรรมชาติ",
        price: 650,
        quantityInStock: 0,
      },
      {
        trial: true,
        colorNameTh: "ไม้ธรรมชาติ",
        price: 65,
        quantityInStock: 1,
      },
    ],
  },
  {
    name: "เบาะรองนั่งเพื่อสุขภาพ รุ่น ErgoCushion",
    description: "เบาะรองนั่งเมมโมรี่โฟมที่ช่วยรองรับกระดูกสันหลังและลดแรงกดทับบริเวณก้นกบขณะนั่งได้เป็นอย่างดี เหมาะสำหรับเก้าอี้ทั่วไปที่ไม่รองรับสรีระ ช่วยให้คุณนั่งทำงานหรือนั่งดูหนังได้นานขึ้นโดยไม่ปวดเมื่อย",
    category: "อุปกรณ์เสริม",
    trial: false,
    tags: ["เบาะรองนั่ง", "สุขภาพ", "ออฟฟิศ"],
    material: "เมมโมรี่โฟม, ผ้าตาข่าย",
    thumbnails: [],
    dimension: {
      width: 45,
      height: 40,
      depth: 8,
      weight: 1.5,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ดำ",
        price: 1200,
        quantityInStock: 12,
      },
    ],
  },
  {
    name: "แผ่นรองเมาส์ Ergonomics รุ่น GelMousePad",
    description: "แผ่นรองเมาส์ที่มีเจลรองข้อมือในตัว ช่วยให้ข้อมืออยู่ในตำแหน่งที่เหมาะสม ลดอาการปวดเมื่อยจากการใช้เมาส์เป็นเวลานาน พื้นผิวเรียบลื่นรองรับการเคลื่อนไหวของเมาส์ได้อย่างแม่นยำ ฐานเป็นยางกันลื่นยึดติดกับโต๊ะได้ดี",
    category: "อุปกรณ์เสริม",
    trial: false,
    tags: ["แผ่นรองเมาส์", "รองข้อมือ", "เมาส์"],
    material: "ผ้า Lycra, เจล",
    thumbnails: [],
    dimension: {
      width: 25,
      height: 2,
      depth: 20,
      weight: 0.3,
    },
    variants: [
      {
        trial: false,
        colorNameTh: "ดำ",
        price: 299,
        quantityInStock: 18,
      },
    ],
  },
];


async function seedProducts() {
    try {
        console.log("Starting product seeding...");

        // Fetch all existing colors to create a lookup map
        const colors = await Color.find({});
        const colorMap = {};
        colors.forEach(color => {
            colorMap[color.name_th] = color._id;
        });

        const productsToInsert = [];

        for (const productData of rawProductsData) {
            // Create a new product object to populate
            const newProduct = { ...productData };

            // Map colorNameTh in variants to actual colorId
            newProduct.variants = newProduct.variants.map(variant => {
                const colorId = colorMap[variant.colorNameTh];
                if (!colorId) {
                    console.warn(`Warning: Color "${variant.colorNameTh}" not found for product "${newProduct.name}". This variant might be invalid.`);
                    return null; // Or handle this error differently, e.g., throw error, use a default color.
                }
                // Return the variant with colorId and without colorNameTh
                const { colorNameTh, ...restOfVariant } = variant;
                return { ...restOfVariant, colorId: colorId };
            }).filter(variant => variant !== null); // Remove any null variants if a color wasn't found

            // If the product has a "variants" field in the raw data but it becomes empty
            // after filtering, you might want to reconsider if it should be added.
            if (newProduct.variants.length > 0) {
                productsToInsert.push(newProduct);
            } else {
                console.warn(`Product "${newProduct.name}" has no valid variants after color lookup and will not be inserted.`);
            }
        }

        // Clear existing products before inserting (optional, but common for seeding)
        console.log("Clearing existing products...");
        await Product.deleteMany({});
        console.log("Existing products cleared.");

        // Insert the processed products
        const createdProducts = await Product.insertMany(productsToInsert);
        console.log(`Successfully created ${createdProducts.length} products!`);
        console.log("Created products sample:", createdProducts.map(p => ({ name: p.name, id: p._id })));

    } catch (error) {
        console.error("Error during product seeding:", error);
    } 
}

export default seedProducts