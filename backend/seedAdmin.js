const bcrypt = require("bcrypt");
const db = require("./models");
const User = db.User;

async function createAdmin() {
  try {
    const exist = await User.findOne({
      where: { email: "admin@qlcv.vn" }
    });

    if (exist) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@2024", 10);

    await User.create({
      name: "Admin",
      email: "admin@qlcv.vn",
      password: hashedPassword,
      role: "admin"
    });

    console.log("Admin created");
  } catch (err) {
    console.error(err);
  }
}

createAdmin();
