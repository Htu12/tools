import os


def delete_files_containing_name(directory, partial_name):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if partial_name in file: 
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"Đã xóa file: {file_path}")
                except Exception as e:
                    print(f"Lỗi khi xóa file {file_path}: {e}")


partial_name_to_delete = ""
start_directory = ""

delete_files_containing_name(start_directory, partial_name_to_delete)
