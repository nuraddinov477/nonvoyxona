from rest_framework import serializers
from .models import (CashRegister, Transaction, TransactionCategory,
                     Debtor, DebtRecord, Creditor, CreditRecord)


class CashRegisterSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = CashRegister
        fields = '__all__'


class TransactionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionCategory
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    cash_register_name = serializers.CharField(source='cash_register.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['created_by', 'date']


class DebtRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebtRecord
        fields = '__all__'
        read_only_fields = ['created_by', 'date']


class DebtorSerializer(serializers.ModelSerializer):
    records = DebtRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Debtor
        fields = '__all__'


class CreditRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditRecord
        fields = '__all__'
        read_only_fields = ['created_by', 'date']


class CreditorSerializer(serializers.ModelSerializer):
    records = CreditRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Creditor
        fields = '__all__'
