#include <iostream>
#include <string>
using namespace std;

struct Book 
{
    string name;
    string author;
    int stock;
    int sales;
};

struct Node 
{
    Book book;
    Node* left;
    Node* right;
    Node* parent;

    Node(Book b)
    {
        book = b; 
        left = nullptr;
        right = nullptr;
        parent = nullptr;
    }
};

class BookstoreHeap 
{
private:
    Node* root;
    int size;

    Node* getLastNode() 
    {
        if (!root) 
        {
            return nullptr;
        }

        int temp = size;
        string path = "";
        while (temp > 1) 
        {
            path = (temp % 2 == 0 ? "L" : "R") + path;
            temp = temp/2;
        }

        Node* current = root;
        for (char direction : path) 
        {
            if (direction == 'L')
            {
                current = current->left;
            }
            else
            {
                current = current->right;
            }
        }
        return current;
    }

    Node* getParentOfNext() 
    {
        {
            if (size == 0) return nullptr;
        }

        int temp = size + 1;
        string path = "";
        while (temp > 1) 
        {
            path = (temp % 2 == 0 ? "L" : "R") + path;
            temp = temp / 2;
        }

        if (path.empty()) 
        {
            return nullptr;
        }

        path.pop_back();
        Node* current = root;
        for (char direction : path) 
        {
            if (direction == 'L')
            {
                current = current->left;
            }
            else
            {
                current = current->right;
            }
        }
        return current;
    }

    void heapifyUp(Node* node) 
    {
        while (node->parent && node->book.sales > node->parent->book.sales) 
        {
            Book temp = node->book;
            node->book = node->parent->book;
            node->parent->book = temp;
            node = node->parent;
        }
    }

    void heapifyDown(Node* node) 
    {
        while (true) 
        {
            Node* largest = node;

            if (node->left && node->left->book.sales > largest->book.sales)
            {
                largest = node->left;
            }

            if (node->right && node->right->book.sales > largest->book.sales)
            {
                largest = node->right;
            }

            if (largest == node)
            {
                break;
            }

            Book temp = node->book;
            node->book = largest->book;
            largest->book = temp;
            node = largest;
        }
    }

    Node* findBook(Node* node, string name) 
    {
        if (!node) 
        {
            return nullptr;
        }

        if (node->book.name == name)
        {
            return node;
        }

        Node* leftResult = findBook(node->left, name);
        if (leftResult) 
        {
            return leftResult;
        }

        return findBook(node->right, name);
    }

public:
    BookstoreHeap() 
    {
        root = nullptr; 
        size = 0;
    }

    void addBook(string name, string author, int stock, int sales) 
    {
        Book newBook = { name, author, stock, sales };
        Node* newNode = new Node(newBook);

        if (!root) 
        {
            root = newNode;
            size = 1;
            return;
        }

        Node* parent = getParentOfNext();
        newNode->parent = parent;

        int temp = size + 1;
        if (temp % 2 == 0)
        {
            parent->left = newNode;
        }
        else
        {
            parent->right = newNode;
        }
        size++;
        heapifyUp(newNode);
    }

    void updateSales(string name, int additionalSales)
    {
        Node* bookNode = findBook(root, name);
        if (!bookNode) 
        {
            cout << "Book has not been found" << endl;
            return;
        }

        bookNode->book.sales = bookNode->book.sales + additionalSales;
        heapifyUp(bookNode);
        cout << "Sales updated for: " << name << endl;
    }

    void getTopSellingBook() 
    {
        if (!root) 
        {
            cout << "Inventory is empty" << endl;
            return;
        }

        cout << "Top Selling Book:" << endl;
        cout << "Name: " << root->book.name << endl;
        cout << "Author: " << root->book.author << endl;
        cout << "Stock: " << root->book.stock << endl;
        cout << "Sales: " << root->book.sales << endl;
    }

    void removeTopSelling() 
    {
        if (!root) 
        {
            cout << "Inventory is empty" << endl;
            return;
        }

        if (root->book.stock > 0) 
        {
            cout << "Book is still available in stock. Cannot remove." << endl;
            return;
        }

        cout << "Removing out of stock book: " << root->book.name << endl;

        if (size == 1) 
        {
            delete root;
            root = nullptr;
            size = 0;
            return;
        }

        Node* lastNode = getLastNode();
        root->book = lastNode->book;

        if (lastNode->parent) 
        {
            if (lastNode->parent->left == lastNode)
            {
                lastNode->parent->left = nullptr;
            }
            else
            {
                lastNode->parent->right = nullptr;
            }
        }

        delete lastNode;
        size--;

        if (root)
        {
            heapifyDown(root);
        }
    }

    void displayInventory(Node* node) 
    {
        if (!node) 
        {
            return;
        }

        cout << "Book: " << node->book.name;
        cout << ", Author: " << node->book.author;
        cout << ", Stock: " << node->book.stock;
        cout << ", Sales: " << node->book.sales << endl;

        displayInventory(node->left);
        displayInventory(node->right);
    }

    void display() 
    {
        if (!root) 
        {
            cout << "Inventory is empty!" << endl;
            return;
        }
        cout << "\nCurrent Inventory:" << endl;
        displayInventory(root);
    }
};

int main() 
{
    BookstoreHeap inventory;

    inventory.addBook("The Great Gatsby", "F. Scott Fitzgerald", 10, 150);
    inventory.addBook("1984", "George Orwell", 15, 200);
    inventory.addBook("To Kill a Mockingbird", "Harper Lee", 8, 175);
    inventory.addBook("Pride and Prejudice", "Jane Austen", 12, 130);
    inventory.addBook("The Catcher in the Rye", "J.D. Salinger", 0, 220);

    inventory.display();

    cout << "\nTop Selling Book" << endl;
    inventory.getTopSellingBook();

    cout << "\nUpdating Sales" << endl;
    inventory.updateSales("1984", 50);

    cout << "\nTop Selling Book After Update" << endl;
    inventory.getTopSellingBook();

    cout << "\nRemoving Top Selling Book (Out of Stock)" << endl;
    inventory.removeTopSelling();

    inventory.display();

    cout << "\nNew Top Selling Book" << endl;
    inventory.getTopSellingBook();
}