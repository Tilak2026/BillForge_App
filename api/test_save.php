<?php
/**
 * BillForge — Data Save Test
 * Simulates saving data like the frontend does
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$db = getDB();
$results = [];

try {
    // TEST 1: Save a Product
    $testProduct = [
        'sku' => 'TEST-' . time(),
        'name' => 'Test Product ' . date('H:i:s'),
        'cat' => 'Test',
        'hsn' => '123456',
        'price' => 100.00,
        'buyPrice' => 50.00,
        'gst' => 18,
        'stock' => 10,
        'min' => 2,
        'unit' => 'Piece',
        'emoji' => '📦'
    ];
    
    $stmt = $db->prepare("INSERT INTO products (sku,name,cat,hsn,price,buyPrice,gst,stock,min,unit,emoji) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute(array_values($testProduct));
    $productId = (int)$db->lastInsertId();
    
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $savedProduct = $stmt->fetch();
    
    $results['product_test'] = [
        'status' => 'success',
        'saved_id' => $productId,
        'saved_name' => $savedProduct['name']
    ];
    
    // TEST 2: Save a Customer
    $testCustomer = [
        'name' => 'Test Customer ' . time(),
        'phone' => '9876543210',
        'email' => 'test@example.com',
        'city' => 'Test City',
        'gstin' => '27AABCT1234H1Z0',
        'orders' => 0,
        'spent' => 0.00,
        'outstanding' => 0.00,
        'lastOrder' => '—',
        'type' => 'B2B'
    ];
    
    $stmt = $db->prepare("INSERT INTO customers (name,phone,email,city,gstin,orders,spent,outstanding,lastOrder,type) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute(array_values($testCustomer));
    $customerId = (int)$db->lastInsertId();
    
    $stmt = $db->prepare("SELECT * FROM customers WHERE id = ?");
    $stmt->execute([$customerId]);
    $savedCustomer = $stmt->fetch();
    
    $results['customer_test'] = [
        'status' => 'success',
        'saved_id' => $customerId,
        'saved_name' => $savedCustomer['name']
    ];
    
    // TEST 3: Save an Invoice
    $testInvoice = [
        'num' => 'INV-TEST-' . date('YmdHis'),
        'customer' => $testCustomer['name'],
        'phone' => $testCustomer['phone'],
        'date' => date('Y-m-d'),
        'items' => json_encode([
            ['name' => $testProduct['name'], 'qty' => 2, 'price' => $testProduct['price'], 'gst' => 18, 'hsn' => $testProduct['hsn']]
        ]),
        'payment' => 'Cash',
        'status' => 'Paid'
    ];
    
    $stmt = $db->prepare("INSERT INTO invoices (num,customer,phone,date,items,payment,status) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([
        $testInvoice['num'],
        $testInvoice['customer'],
        $testInvoice['phone'],
        $testInvoice['date'],
        $testInvoice['items'],
        $testInvoice['payment'],
        $testInvoice['status']
    ]);
    $invoiceId = (int)$db->lastInsertId();
    
    $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ?");
    $stmt->execute([$invoiceId]);
    $savedInvoice = $stmt->fetch();
    
    $results['invoice_test'] = [
        'status' => 'success',
        'saved_id' => $invoiceId,
        'saved_num' => $savedInvoice['num'],
        'saved_customer' => $savedInvoice['customer']
    ];
    
    // TEST 4: Save an Expense
    $testExpense = [
        'date' => date('Y-m-d'),
        'cat' => 'Transport',
        'desc' => 'Test expense ' . time(),
        'vendor' => 'Test Vendor',
        'amount' => 500.00,
        'gst' => 0.00,
        'paidBy' => 'Cash',
        'receipt' => 'Test Receipt'
    ];
    
    $stmt = $db->prepare("INSERT INTO expenses (date,cat,`desc`,vendor,amount,gst,paidBy,receipt) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->execute(array_values($testExpense));
    $expenseId = (int)$db->lastInsertId();
    
    $stmt = $db->prepare("SELECT * FROM expenses WHERE id = ?");
    $stmt->execute([$expenseId]);
    $savedExpense = $stmt->fetch();
    
    $results['expense_test'] = [
        'status' => 'success',
        'saved_id' => $expenseId,
        'saved_desc' => $savedExpense['desc']
    ];
    
    // Cleanup test data
    $db->exec("DELETE FROM invoices WHERE id = $invoiceId");
    $db->exec("DELETE FROM expenses WHERE id = $expenseId");
    $db->exec("DELETE FROM customers WHERE id = $customerId");
    $db->exec("DELETE FROM products WHERE id = $productId");
    
    $results['overall'] = [
        'status' => 'success',
        'message' => '✅ All data save operations working correctly!',
        'db_connection' => 'Connected',
        'tables' => 'All tables operational'
    ];
    
} catch (Exception $e) {
    $results['error'] = [
        'status' => 'error',
        'message' => $e->getMessage(),
        'code' => $e->getCode()
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
