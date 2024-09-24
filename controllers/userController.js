exports.getUserData = (req, res) => {
    res.json({ message: 'Aquí están tus datos', user: req.user });
};