const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for the individual items within the cart
const cartItemSchema = new Schema({

    product: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Product', // Reference the Product model
            required: true
        },
        variant: {
            _id: {
                type: Schema.Types.ObjectId,
                ref: 'Product.variants', // Reference the nested variant within the Product model
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1 
            }
        }
    }
}, { _id: false }); // Disable the auto-generated _id for subdocuments

// Main Cart schema
const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true
    },
    items: {
        type: [cartItemSchema],
        required: true,
        default: [] // Default to an empty array
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Create the Mongoose model
const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;