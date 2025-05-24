const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/freelancer_platform')
  .then(async () => {
    const res = await User.updateMany(
      { userType: 'freelancer', experience: { $exists: false } },
      { $set: { experience: 0 } }
    );
    console.log(res);
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  }); 