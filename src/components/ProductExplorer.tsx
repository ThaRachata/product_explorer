// คอมโพเนนต์สำหรับแสดงรายการสินค้า
"use client";

import { useEffect, useState } from "react";
import { defaultQuery, fetchProducts } from "@/lib/products";
import type {
  Product,
  ProductDraft,
  ProductList,
  SearchQuery,
} from "@/lib/products";
import ProductSearchForm from "./ProductSearchForm";
import ProductForm from "./ProductForm";

type LoadState = "loading" | "error" | "ready"; // สรา้ง type เพื่อจำกัด สถานะการดึงข้อมูลจะเป็นไปได้แค่ 3 อย่างเท่านั้น

export default function ProductExplorer() {
  const [products, setProducts] = useState<Product[]>([]);
  // const [status, setStatus] = useState<LoadState>("idle");
  const [status, setStatus] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  function showResult(list: ProductList) {
    setProducts(list.products);
    setStatus("ready");
  }

  function showError(error: unknown) {
    setErrorMessage(
      error instanceof Error ? error.message : "เรียกข้อมูลไม่สำเร็จ",
    );
    setStatus("error");
  }

  async function loadProducts(query: SearchQuery) {
    setStatus("loading");
    setErrorMessage("");

    try {
      showResult(await fetchProducts(query));
    } catch (error) {
      showError(error);
    }
  }

  function saveProduct(draft: ProductDraft) {
    if (editing) {
      setProducts(
        products.map((item) =>
          item.id === editing.id
            ? { ...draft, id: editing.id, thumbnail: editing.thumbnail }
            : item,
        ),
      );
      setEditing(null);
      return;
    }
    setProducts([...products, { ...draft, id: Date.now() }]); // ใช้ Date.now() เป็น id ชั่วคราวสำหรับสินค้าใหม่
  }

  function removeProduct(id: number) {
    setProducts(products.filter((item) => item.id !== id));
    setPendingDelete(null);

    if (editing?.id === id) {
      setEditing(null);
    }
  }

  useEffect(() => {
    fetchProducts(defaultQuery).then(showResult).catch(showError);
  }, []);

  return (
    <main>
      <h1>รายการสินค้า</h1>

      <ProductSearchForm onSearch={loadProducts} />

      <button
        type="button"
        onClick={() => loadProducts(defaultQuery)}
        disabled={status === "loading"}
      >
        {status === "loading" ? "กำลังโหลด" : "คืนค่าเริ่มต้น"}
      </button>

      {/* ส่วนแสดงผล เขียนเพิ่มในหัวข้อ 1.7 */}

      <section aria-live="polite">
        {/* แสดงผลลัพธ์ตามสถานะ */}

        {status === "loading" && <p>กำลังโหลดข้อมูล</p>}

        {status === "error" && <p role="alert">{errorMessage}</p>}

        {status === "ready" && products.length === 0 && (
          <p>ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
        )}

        {status === "ready" && products.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ชื่อสินค้า</th>
                <th>ราคา</th>
                <th>คงเหลือ</th>
                <th>หมวดหมู่</th>
                <th>รูปภาพ</th>
                <th>แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.price}</td>
                  <td>{item.stock}</td>
                  <td>{item.category}</td>
                  <td>
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        width="100"
                        height="100"
                      />
                    )}
                  </td>
                  <td>
                    <button type="button" onClick={() => setEditing(item)}>
                      แก้ไข
                    </button>
                    {pendingDelete?.id === item.id ? (
                      <span className="delete-confirmation" role="group">
                        <button
                          type="button"
                          className="confirm-delete"
                          onClick={() => removeProduct(item.id)}
                        >
                          ยืนยันการลบ
                        </button>
                        <button
                          type="button"
                          className="cancel-delete"
                          onClick={() => setPendingDelete(null)}
                        >
                          ยกเลิก
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                      >
                        ลบ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <div>
        <ProductForm
          editing={editing}
          onSave={saveProduct}
          onCancel={() => setEditing(null)}
        />
      </div>
    </main>
  );
}
