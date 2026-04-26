from rest_framework import serializers
from .models import Sale, SaleItem, UnsoldProduct


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = '__all__'
        read_only_fields = ['total_price']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    seller_name = serializers.CharField(source='seller.get_full_name', read_only=True, default=None)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)

    class Meta:
        model = Sale
        fields = '__all__'
        read_only_fields = ['total_amount', 'seller', 'date']


class CreateSaleSerializer(serializers.Serializer):
    payment_type = serializers.ChoiceField(choices=Sale.PaymentType.choices)
    point = serializers.IntegerField(required=False, allow_null=True)
    items = serializers.ListField(child=serializers.DictField(), min_length=1)

    def validate_items(self, items):
        for item in items:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError("Har bir elementda product_id va quantity bo'lishi kerak")
            if int(item['quantity']) <= 0:
                raise serializers.ValidationError("Miqdor 0 dan katta bo'lishi kerak")
        return items


class UnsoldProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)

    class Meta:
        model = UnsoldProduct
        fields = '__all__'
        read_only_fields = ['created_by', 'date']
