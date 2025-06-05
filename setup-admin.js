require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://ledosportsacademy:KYbsTxWjVBvPnREP@ledosportsacademy.ejcd06z.mongodb.net/?retryWrites=true&w=majority&appName=ledosportsacademy';

async function createAdminUser() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'ledosportsacademy@gmail.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create new admin user
        const adminUser = new User({
            email: 'ledosportsacademy@gmail.com',
            password: '@Ledoxyz.com',
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser(); 