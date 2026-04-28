export const protect = (req, res, next) => {
    try {
        const { userId } = req.auth;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};