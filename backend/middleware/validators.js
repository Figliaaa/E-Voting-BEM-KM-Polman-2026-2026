const Joi = require('joi');

const loginSchema = Joi.object({
    nim: Joi.string().alphanum().length(9).required().messages({
        'string.length': 'NIM harus 9 digit',
        'any.required': 'NIM diperlukan'
    }),
    token: Joi.string().alphanum().min(1).max(10).required().messages({
        'any.required': 'Token akses diperlukan'
    })
});

const voteSchema = Joi.object({
    candidateId: Joi.number().integer().min(1).required().messages({
        'any.required': 'ID kandidat diperlukan',
        'number.base': 'ID kandidat harus berupa angka'
    })
});

const adminLoginSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required().messages({
        'string.min': 'Username minimal 3 karakter',
        'any.required': 'Username diperlukan'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password minimal 6 karakter',
        'any.required': 'Password diperlukan'
    })
});

const candidateSchema = Joi.object({
    nama_ketua: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Nama ketua minimal 3 karakter',
        'any.required': 'Nama ketua diperlukan'
    }),
    nama_wakil: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Nama wakil minimal 3 karakter',
        'any.required': 'Nama wakil diperlukan'
    }),
    deskripsi: Joi.string().max(500).allow('').messages({
        'string.max': 'Deskripsi maksimal 500 karakter'
    }),
    foto_url: Joi.string().uri().allow('').messages({
        'string.uri': 'URL foto tidak valid'
    })
});

const updateCandidateSchema = Joi.object({
    nama_ketua: Joi.string().min(3).max(100).messages({
        'string.min': 'Nama ketua minimal 3 karakter'
    }),
    nama_wakil: Joi.string().min(3).max(100).messages({
        'string.min': 'Nama wakil minimal 3 karakter'
    }),
    deskripsi: Joi.string().max(500).allow('').messages({
        'string.max': 'Deskripsi maksimal 500 karakter'
    }),
    foto_url: Joi.string().uri().allow('').messages({
        'string.uri': 'URL foto tidak valid'
    })
}).min(1).messages({
    'object.min': 'Minimal ada satu field yang diubah'
});

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const messages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({ success: false, errors: messages });
        }
        
        req.validatedData = value;
        next();
    };
};

module.exports = {
    validate,
    loginSchema,
    voteSchema,
    adminLoginSchema,
    candidateSchema,
    updateCandidateSchema
};
