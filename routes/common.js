

function isAuthenticated(req, res, next) {
    if (!req.user) {
        return res.status(401).send({
            message: 'Login Required'
        });
    }
    next();
}

module.exports.isAuthenticated = isAuthenticated;