from rest_framework import serializers
from .models import SalesPoint, PointStock, ProductTransfer, TransferItem, PointReturn


class SalesPointSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = SalesPoint
        fields = '__all__'

    def get_employee_count(self, obj):
        return obj.employees.count()


class PointStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=12,
                                              decimal_places=2, read_only=True)

    class Meta:
        model = PointStock
        fields = '__all__'


class TransferItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = TransferItem
        fields = '__all__'


class ProductTransferSerializer(serializers.ModelSerializer):
    items = TransferItemSerializer(many=True, read_only=True)
    point_name = serializers.CharField(source='point.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ProductTransfer
        fields = '__all__'
        read_only_fields = ['sent_by', 'accepted_by', 'accepted_at', 'date']


class CreateTransferSerializer(serializers.Serializer):
    point_id = serializers.IntegerField()
    items = serializers.ListField(child=serializers.DictField(), min_length=1)
    note = serializers.CharField(required=False, default='')


class PointReturnSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    point_name = serializers.CharField(source='point.name', read_only=True)

    class Meta:
        model = PointReturn
        fields = '__all__'
        read_only_fields = ['created_by', 'date']
