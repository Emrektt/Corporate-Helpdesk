"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const SECRET_KEY = process.env.SECRET_KEY || 'my-super-secret-key-12345';
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ detail: 'Email and password required' });
    }
    const user = await prisma_1.prisma.users.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ detail: 'Bu e-posta adresine sahip kullanıcı bulunamadı.' });
    }
    if (!user.is_active) {
        return res.status(403).json({ detail: 'Hesabınız pasif durumda.' });
    }
    const access_token = jsonwebtoken_1.default.sign({ sub: user.email }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ access_token, token_type: 'bearer' });
});
router.post('/azure', async (req, res) => {
    const { access_token } = req.body;
    try {
        const decoded = jsonwebtoken_1.default.decode(access_token);
        const email = decoded.preferred_username || decoded.upn || decoded.email;
        const name = decoded.name || 'Azure User';
        const oid = decoded.oid;
        if (!email) {
            return res.status(400).json({ detail: 'Cannot find email in Azure token' });
        }
        let user = await prisma_1.prisma.users.findFirst({
            where: {
                OR: [{ entra_object_id: oid }, { email }]
            }
        });
        if (!user) {
            user = await prisma_1.prisma.users.create({
                data: {
                    email,
                    full_name: name,
                    entra_object_id: oid,
                    is_active: true,
                    role: 'SUPPORT_AGENT', // default fallback
                }
            });
        }
        else if (!user.entra_object_id) {
            user = await prisma_1.prisma.users.update({
                where: { id: user.id },
                data: { entra_object_id: oid }
            });
        }
        const local_access_token = jsonwebtoken_1.default.sign({ sub: user.email }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ access_token: local_access_token, token_type: 'bearer' });
    }
    catch (error) {
        console.error(error);
        res.status(401).json({ detail: 'Invalid token' });
    }
});
exports.default = router;
