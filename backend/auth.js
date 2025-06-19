import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

const opts = {
    jwtFromRequest: (req) => {
        let token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        return token;
    },
        secretOrKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy8yBKM7qsdM/NhsUpjPPwFuhYxTTUmWddJ0J5pIpgVBnFuSBFkTk3AzvYJrFLaHjOahEbs6/WaRuR2TOgbtJi1SEcwNk/mArwGpeTzOGo3g6chiy4ScmEtHTK5+18Mz5+NDhQ6S23joDm6zpQLM2yoNIUDMCPctlb3IiuZl2LKqOCdqCiBExORGKkDKlU8UH5hTSc+C8sp0EOx/xoN0UoWVFjd74fu30Vvw4tS0QomUN19L0VMrS14HmOFbJQaEMGIWmP2hJhGjFd8GTqQmN6OJzeM3cG/VdYfAyeY9yBMxtGTkSvuqVH2NIEPnACtHU3IfGpRCk7GsQ9fJc4BB6yQIDAQAB
-----END PUBLIC KEY-----`,
    algorithms: ['RS256'],
    ignoreExpiration: false
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    return done(null, jwt_payload);
}));

export default passport;