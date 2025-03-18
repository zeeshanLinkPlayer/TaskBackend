const User=require("../models/User")
const seedUsers = async () => {
    const users = [
      { username: "admin", password: "admin123", name: "Admin", email: "admin@example.com", role: "admin" },
      { username: "manager", password: "manager123", name: "Manager", email: "manager@example.com", role: "manager" },
      { username: "user", password: "user123", name: "User", email: "user@example.com", role: "user" }
    ];
  
    for (const userData of users) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        await User.create(userData); // No need to manually hash
        console.log(`✅ User ${userData.username} created`);
      } else {
        console.log(`⚠️ User ${userData.username} already exists`);
      }
    }
  };
module.exports=seedUsers  